import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create a rating and review for a completed booking' })
  createReview(@Request() req, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(req.user.id, req.user.role, dto);
  }

  @Get('mine')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List reviews for the current user' })
  listMyReviews(@Request() req) {
    return this.reviewsService.listMyReviews(req.user.id, req.user.role);
  }

  @Get('providers/:providerUserId')
  @ApiOperation({ summary: 'List public reviews for a provider' })
  listProviderReviews(@Param('providerUserId') providerUserId: string) {
    return this.reviewsService.listProviderReviews(providerUserId);
  }
}