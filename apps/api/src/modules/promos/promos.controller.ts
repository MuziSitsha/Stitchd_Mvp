import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RedeemReferralDto } from './dto/redeem-referral.dto';
import { PromosService } from './promos.service';

@ApiTags('promos')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get('active')
  @ApiOperation({ summary: 'List active promo offers' })
  listActivePromos() {
    return this.promosService.listActivePromos();
  }

  @Get('referral-summary')
  @ApiOperation({ summary: 'Get referral code and reward summary for the current user' })
  getReferralSummary(@Request() req) {
    return this.promosService.getReferralSummary(req.user.id);
  }

  @Post('referral/redeem')
  @ApiOperation({ summary: 'Redeem a referral code and apply both wallet rewards' })
  redeemReferralCode(@Request() req, @Body() dto: RedeemReferralDto) {
    return this.promosService.redeemReferralCode(req.user.id, dto.referralCode);
  }
}