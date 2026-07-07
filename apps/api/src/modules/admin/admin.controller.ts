import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AssignCoachDto } from './dto/assign-coach.dto';
import { CreateCoachProfileDto } from './dto/create-coach-profile.dto';
import { CreateWeddingVendorDto } from './dto/create-wedding-vendor.dto';
import { ReviewProviderVerificationDto } from './dto/review-provider-verification.dto';
import { UpdatePlatformSettingsDto } from './dto/update-platform-settings.dto';
import { UpdateWeddingVendorDto } from './dto/update-wedding-vendor.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get platform settings' })
  getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update platform settings as an admin' })
  updateSettings(@Request() req, @Body() dto: UpdatePlatformSettingsDto) {
    return this.adminService.updateSettings(req.user, dto);
  }

  @Get('providers/pending-verification')
  @ApiOperation({ summary: 'List providers waiting for verification review' })
  listPendingProviderVerifications(@Request() req) {
    return this.adminService.listPendingProviderVerifications(req.user.role);
  }

  @Get('dashboard-metrics')
  @ApiOperation({ summary: 'Get admin dashboard metrics for marketplace operations' })
  getDashboardMetrics(@Request() req) {
    return this.adminService.getDashboardMetrics(req.user.role);
  }

  @Get('payments/recent')
  @ApiOperation({ summary: 'List recent payment transactions for admin review' })
  listRecentPayments(@Request() req) {
    return this.adminService.listRecentPayments(req.user.role);
  }

  @Patch('providers/:providerUserId/verification')
  @ApiOperation({ summary: 'Approve or reject provider verification' })
  reviewProviderVerification(
    @Request() req,
    @Param('providerUserId') providerUserId: string,
    @Body() dto: ReviewProviderVerificationDto,
  ) {
    return this.adminService.reviewProviderVerification(req.user, providerUserId, dto);
  }

  @Get('wedding-events')
  @ApiOperation({ summary: 'List all wedding events with owner, coach, and package counts' })
  listWeddingEvents(@Request() req) {
    return this.adminService.listWeddingEvents(req.user.role);
  }

  @Get('wedding-events/:id')
  @ApiOperation({ summary: 'Get a wedding event with its full package/vendor selection list' })
  getWeddingEventDetail(@Request() req, @Param('id') id: string) {
    return this.adminService.getWeddingEventDetail(req.user.role, id);
  }

  @Patch('wedding-events/:id/assign-coach')
  @ApiOperation({ summary: 'Assign or reassign a coach to a wedding event' })
  assignCoach(@Request() req, @Param('id') id: string, @Body() dto: AssignCoachDto) {
    return this.adminService.assignCoach(req.user.role, id, dto);
  }

  @Get('coaches')
  @ApiOperation({ summary: 'List coach profiles with assigned-couple caseload' })
  listCoaches(@Request() req) {
    return this.adminService.listCoaches(req.user.role);
  }

  @Post('coaches')
  @ApiOperation({ summary: 'Create or update a coach profile for an existing coach-role user' })
  createCoachProfile(@Request() req, @Body() dto: CreateCoachProfileDto) {
    return this.adminService.createCoachProfile(req.user.role, dto);
  }

  @Get('analytics/category-breakdown')
  @ApiOperation({ summary: 'Package selections and amounts paid, grouped by category' })
  getCategoryBreakdown(@Request() req) {
    return this.adminService.getCategoryBreakdown(req.user.role);
  }

  @Get('analytics/coach-breakdown')
  @ApiOperation({ summary: 'Assigned couples and amounts paid, grouped by coach' })
  getCoachBreakdown(@Request() req) {
    return this.adminService.getCoachBreakdown(req.user.role);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'List the real wedding vendor catalog for admin management' })
  listWeddingVendors(@Request() req) {
    return this.adminService.listWeddingVendors(req.user.role);
  }

  @Post('vendors')
  @ApiOperation({ summary: 'Add a vendor to the real wedding vendor catalog' })
  createWeddingVendor(@Request() req, @Body() dto: CreateWeddingVendorDto) {
    return this.adminService.createWeddingVendor(req.user.role, dto);
  }

  @Patch('vendors/:id')
  @ApiOperation({ summary: 'Update a vendor in the catalog' })
  updateWeddingVendor(@Request() req, @Param('id') id: string, @Body() dto: UpdateWeddingVendorDto) {
    return this.adminService.updateWeddingVendor(req.user.role, id, dto);
  }

  @Delete('vendors/:id')
  @ApiOperation({ summary: 'Remove a vendor from the catalog' })
  deleteWeddingVendor(@Request() req, @Param('id') id: string) {
    return this.adminService.deleteWeddingVendor(req.user.role, id);
  }
}