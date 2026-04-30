import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { BookingsService } from './bookings.service';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingLocationDto } from './dto/update-booking-location.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a booking' })
  createBooking(@Request() req, @Body() dto: CreateBookingDto) {
    return this.bookingsService.createBooking(req.user.id, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'List bookings for the current user' })
  getMyBookings(@Request() req) {
    return this.bookingsService.listMyBookings(req.user.id, req.user.role);
  }

  @Get('provider/available')
  @ApiOperation({ summary: 'List open bookings available to providers' })
  listAvailableBookings() {
    return this.bookingsService.listAvailableForProviders();
  }

  @Patch(':id/accept')
  @ApiOperation({ summary: 'Accept an available booking as a provider' })
  acceptBooking(@Request() req, @Param('id') id: string) {
    return this.bookingsService.acceptBooking(id, req.user.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status as the assigned provider' })
  updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(id, req.user.id, dto.status);
  }

  @Patch(':id/tracking')
  @ApiOperation({ summary: 'Update the provider live location for an active booking' })
  updateProviderLocation(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateBookingLocationDto,
  ) {
    return this.bookingsService.updateProviderLocation(id, req.user.id, {
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a booking as the customer or assigned provider' })
  cancelBooking(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.id, dto.reason);
  }
}