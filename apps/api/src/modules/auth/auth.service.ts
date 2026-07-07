import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import axios from 'axios';
import { normalizeSaPhone } from '../../common/phone.util';
import { CoachProfileEntity } from '../planner/entities/coach-profile.entity';
import { WeddingVendorProfileEntity } from '../planner/entities/wedding-vendor-profile.entity';
import { OtpEntity } from './entities/otp.entity';
import { UsersService } from '../users/users.service';
import { UserEntity, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_OTP_ATTEMPTS = 3;

  constructor(
    @InjectRepository(OtpEntity)
    private otpRepository: Repository<OtpEntity>,
    @InjectRepository(CoachProfileEntity)
    private coachProfilesRepository: Repository<CoachProfileEntity>,
    @InjectRepository(WeddingVendorProfileEntity)
    private vendorProfilesRepository: Repository<WeddingVendorProfileEntity>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // Step 1: Send OTP to SA mobile number
  async sendOtp(phone: string): Promise<{ message: string; expiresIn: number }> {
    const normalizedPhone = normalizeSaPhone(phone);
    const demoFixedOtp = this.configService.get<string>('DEMO_FIXED_OTP')?.trim();

    // Generate 6-digit OTP
    const otpCode = demoFixedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Invalidate any existing OTPs for this number
    await this.otpRepository.update(
      { phone: normalizedPhone, used: false },
      { used: true },
    );

    // Save new OTP
    await this.otpRepository.save({
      phone: normalizedPhone,
      hashedCode: hashedOtp,
      expiresAt,
      attempts: 0,
    });

    // Send via Clickatell when SMS is configured, otherwise allow a demo OTP fallback.
    if (this.configService.get<string>('app.env') === 'production' && !demoFixedOtp) {
      await this.sendSmsClickatell(normalizedPhone, otpCode);
    } else {
      this.logger.warn(
        `[OTP FALLBACK] Using ${demoFixedOtp ? 'configured demo OTP' : 'logged OTP'} for ${normalizedPhone}: ${otpCode}`,
      );
    }

    return {
      message: 'OTP sent successfully',
      expiresIn: this.OTP_EXPIRY_MINUTES * 60,
    };
  }

  // Step 2: Verify OTP and return JWT tokens
  async verifyOtp(
    phone: string,
    code: string,
    role: UserRole = UserRole.CUSTOMER,
  ): Promise<{ accessToken: string; refreshToken: string; isNewUser: boolean; user: any }> {
    const normalizedPhone = normalizeSaPhone(phone);

    const otp = await this.otpRepository.findOne({
      where: { phone: normalizedPhone, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) throw new UnauthorizedException('No active OTP found for this number');
    if (new Date() > otp.expiresAt) throw new UnauthorizedException('OTP has expired');
    if (otp.attempts >= this.MAX_OTP_ATTEMPTS) {
      throw new UnauthorizedException('Too many failed attempts. Request a new OTP.');
    }

    const isValid = await bcrypt.compare(code, otp.hashedCode);
    if (!isValid) {
      await this.otpRepository.increment({ id: otp.id }, 'attempts', 1);
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Mark OTP as used
    await this.otpRepository.update({ id: otp.id }, { used: true });

    let user = await this.usersService.findByPhone(normalizedPhone);
    let isNewUser = false;

    if (role === UserRole.COACH) {
      // Coaches don't self-register: an admin must have already created a
      // CoachProfileEntity for this phone number's account before it can log
      // in as a coach.
      const coachProfile = user
        ? await this.coachProfilesRepository.findOne({ where: { userId: user.id } })
        : null;
      if (!user || user.role !== UserRole.COACH || !coachProfile) {
        throw new UnauthorizedException(
          'This number is not an approved coach account yet. Ask an admin to add you as a coach first.',
        );
      }
    } else if (role === UserRole.VENDOR) {
      // Vendors don't self-register either: an admin must have already
      // linked this phone number to a real catalog listing via
      // WeddingVendorProfileEntity before it can log in as a vendor.
      const vendorProfile = user
        ? await this.vendorProfilesRepository.findOne({ where: { userId: user.id } })
        : null;
      if (!user || user.role !== UserRole.VENDOR || !vendorProfile) {
        throw new UnauthorizedException(
          'This number is not an approved vendor account yet. Ask an admin to grant vendor access first.',
        );
      }
    } else if (role === UserRole.PROVIDER || role === UserRole.ADMIN) {
      // Neither role has a self-registration flow: provider is a retired
      // legacy role with no signup UI, and admin has its own dedicated
      // email/password login. Without this, anyone could POST role: "admin"
      // to this public endpoint and self-provision an admin account via
      // createFromPhone below.
      throw new UnauthorizedException('This role cannot self-register via OTP sign-in.');
    } else if (!user) {
      user = await this.usersService.createFromPhone(normalizedPhone, role);
      isNewUser = true;
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);
    return { ...tokens, isNewUser, user: this.sanitizeUser(user) };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.generateTokens(user.id, user.phone, user.role);
  }

  async adminLogin(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    await this.ensureConfiguredAdminAccount(normalizedEmail);

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user || user.role !== UserRole.ADMIN || !user.passwordHash) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    const tokens = await this.generateTokens(user.id, user.phone, user.role);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('app.jwtRefreshExpiresIn'),
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async ensureConfiguredAdminAccount(email: string): Promise<void> {
    const configuredEmail = this.configService.get<string>('app.adminEmail')?.trim().toLowerCase();
    const configuredPassword = this.configService.get<string>('app.adminPassword');
    if (!configuredEmail || !configuredPassword || configuredEmail !== email) {
      return;
    }

    const passwordHash = await bcrypt.hash(configuredPassword, 10);
    await this.usersService.upsertAdminAccount({
      email: configuredEmail,
      phone: this.configService.get<string>('app.adminPhone') || '+27820000000',
      passwordHash,
      firstName: this.configService.get<string>('app.adminFirstName') || 'STITCHD',
      lastName: this.configService.get<string>('app.adminLastName') || 'Admin',
    });
  }

  private sanitizeUser(user: UserEntity) {
    const { passwordHash, fcmToken, ...safeUser } = user;
    return safeUser;
  }


  private async sendSmsClickatell(phone: string, otp: string): Promise<void> {
    const apiKey = this.configService.get<string>('app.clickatellApiKey');
    try {
      await axios.post(
        'https://platform.clickatell.com/messages/http/send',
        null,
        {
          params: {
            apiKey,
            to: phone,
            content: `Your STITCHD verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes. Do not share this code.`,
          },
        },
      );
    } catch (err) {
      this.logger.error(`Failed to send SMS to ${phone}`, err);
      throw new BadRequestException('Failed to send OTP. Please try again.');
    }
  }
}
