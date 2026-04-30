import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WalletReferenceType,
  WalletTransactionDirection,
} from '../wallet/entities/wallet-transaction.entity';
import { WalletService } from '../wallet/wallet.service';
import { UserEntity } from '../users/entities/user.entity';
import { PromoRedemptionEntity } from './entities/promo-redemption.entity';
import { PromoDiscountType, PromoEntity } from './entities/promo.entity';

type PromoPreview = {
  promo: PromoEntity;
  discountCents: number;
};

@Injectable()
export class PromosService {
  private readonly referralRewardCents = 5000;

  constructor(
    @InjectRepository(PromoEntity)
    private readonly promosRepository: Repository<PromoEntity>,
    @InjectRepository(PromoRedemptionEntity)
    private readonly promoRedemptionsRepository: Repository<PromoRedemptionEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly walletService: WalletService,
  ) {}

  async listActivePromos() {
    const now = new Date();
    const promos = await this.promosRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
    return promos.filter((item) => (!item.startsAt || item.startsAt <= now) && (!item.endsAt || item.endsAt >= now));
  }

  async getReferralSummary(userId: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const referralsCount = await this.usersRepository.count({ where: { referredByCode: user.referralCode } });

    return {
      referralCode: user.referralCode,
      referredByCode: user.referredByCode,
      referralsCount,
      rewardPerReferralCents: this.referralRewardCents,
      referralEarningsCents: referralsCount * this.referralRewardCents,
    };
  }

  async previewPromoForBooking(userId: string, promoCode: string, quotedPriceCents: number): Promise<PromoPreview> {
    const promo = await this.promosRepository.findOne({ where: { code: promoCode.trim().toUpperCase() } });
    if (!promo || !promo.isActive) {
      throw new NotFoundException('Promo code not found');
    }

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      throw new BadRequestException('This promo is not active yet');
    }
    if (promo.endsAt && promo.endsAt < now) {
      throw new BadRequestException('This promo has expired');
    }
    if (promo.minBookingAmountCents > quotedPriceCents) {
      throw new BadRequestException('Booking amount does not qualify for this promo');
    }
    if (promo.usageLimit != null && promo.usageCount >= promo.usageLimit) {
      throw new BadRequestException('This promo has reached its usage limit');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (promo.referralOnly && !user.referredByCode) {
      throw new BadRequestException('This promo is reserved for referred users');
    }

    const existingRedemption = await this.promoRedemptionsRepository.findOne({
      where: { promoId: promo.id, userId },
    });
    if (existingRedemption) {
      throw new BadRequestException('You have already used this promo code');
    }

    let discountCents = 0;
    if (promo.discountType === PromoDiscountType.FLAT) {
      discountCents = promo.discountValue;
    } else {
      discountCents = Math.round(quotedPriceCents * (promo.discountValue / 100));
      if (promo.maxDiscountCents != null) {
        discountCents = Math.min(discountCents, promo.maxDiscountCents);
      }
    }

    return {
      promo,
      discountCents: Math.max(0, Math.min(discountCents, quotedPriceCents)),
    };
  }

  async consumePromoForBooking(input: { userId: string; bookingId: string; promoId: string; discountCents: number }) {
    await this.promoRedemptionsRepository.save(
      this.promoRedemptionsRepository.create({
        promoId: input.promoId,
        userId: input.userId,
        bookingId: input.bookingId,
        discountCents: input.discountCents,
      }),
    );

    await this.promosRepository.increment({ id: input.promoId }, 'usageCount', 1);
  }

  async redeemReferralCode(userId: string, referralCode: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.referredByCode) {
      throw new BadRequestException('Referral code already redeemed for this account');
    }

    const normalizedCode = referralCode.trim().toUpperCase();
    if (normalizedCode === user.referralCode) {
      throw new BadRequestException('You cannot redeem your own referral code');
    }

    const referrer = await this.usersRepository.findOne({ where: { referralCode: normalizedCode } });
    if (!referrer) {
      throw new NotFoundException('Referral code not found');
    }

    user.referredByCode = normalizedCode;
    await this.usersRepository.save(user);

    await this.walletService.recordTransaction({
      userId: user.id,
      direction: WalletTransactionDirection.CREDIT,
      amountCents: this.referralRewardCents,
      referenceType: WalletReferenceType.MANUAL_ADJUSTMENT,
      referenceId: `referral-signup-${user.id}`,
      description: `Referral signup bonus from ${normalizedCode}`,
    });

    await this.walletService.recordTransaction({
      userId: referrer.id,
      direction: WalletTransactionDirection.CREDIT,
      amountCents: this.referralRewardCents,
      referenceType: WalletReferenceType.MANUAL_ADJUSTMENT,
      referenceId: `referral-invite-${user.id}`,
      description: `Referral reward for inviting ${user.phone}`,
    });

    return this.getReferralSummary(userId);
  }
}