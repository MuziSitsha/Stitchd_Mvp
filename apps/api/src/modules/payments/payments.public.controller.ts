import { Body, Controller, Get, HttpCode, Post, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { PaymentsService } from './payments.service';

@ApiExcludeController()
@Controller('payments')
export class PaymentsPublicController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('checkout/result')
  renderCheckoutResult(
    @Query('id') transactionId: string | undefined,
    @Query('resourcePath') resourcePath: string | undefined,
    @Res() res: Response,
  ) {
    const html = this.paymentsService.getCheckoutResultHtml({ transactionId, resourcePath });
    res.type('html').send(html);
  }

  @Post('webhooks/payfast')
  @HttpCode(200)
  confirmPayfastWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.confirmPayfastWebhook(payload);
  }
}