import { Controller, Get, HttpCode, Param, Post, Query, Res, Body } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';

@ApiExcludeController()
@Controller('payments')
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('checkout/:checkoutId')
  async renderCheckout(@Param('checkoutId') checkoutId: string, @Res() res: Response) {
    const html = await this.paymentsService.getHostedCheckoutHtml(checkoutId);
    res.type('html').send(html);
  }

  @Get('checkout/result')
  renderCheckoutResult(
    @Query('id') transactionId: string | undefined,
    @Query('resourcePath') resourcePath: string | undefined,
    @Res() res: Response,
  ) {
    const html = this.paymentsService.getCheckoutResultHtml({ transactionId, resourcePath });
    res.type('html').send(html);
  }

  @Post('webhooks/peach')
  @HttpCode(200)
  confirmPeachWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.confirmPeachWebhook(payload);
  }
}