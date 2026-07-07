import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserRole } from '../users/entities/user.entity';
import { PlannerService, PlannerEventType, PlannerPersona } from './planner.service';
import { CreateInspirationNoteDto } from './dto/create-inspiration-note.dto';
import { CreateVendorSelectionDto } from './dto/create-vendor-selection.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateVendorSelectionDto } from './dto/update-vendor-selection.dto';
import { UpsertWeddingEventDto } from './dto/upsert-wedding-event.dto';

function assertCoach(role: UserRole) {
  if (role !== UserRole.COACH) {
    throw new ForbiddenException('Coach access is required for this action');
  }
}

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get('events/mine')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Get (or create) the caller's real wedding event, vendor selections, and coach" })
  getMyEvent(@Request() req) {
    return this.plannerService.getMyEventWithSelections(req.user.id);
  }

  @Patch('events/mine')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Update the caller's wedding event details" })
  updateMyEvent(@Request() req, @Body() dto: UpsertWeddingEventDto) {
    return this.plannerService.updateMyEvent(req.user.id, dto);
  }

  @Post('events/mine/vendors')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Add a vendor/package selection to the caller's wedding event" })
  addVendorSelection(@Request() req, @Body() dto: CreateVendorSelectionDto) {
    return this.plannerService.addVendorSelection(req.user.id, dto);
  }

  @Patch('events/mine/vendors/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update a vendor/package selection status or amount paid' })
  updateVendorSelection(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateVendorSelectionDto,
  ) {
    return this.plannerService.updateVendorSelection(req.user.id, id, dto);
  }

  @Get('events/mine/inspiration')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "List the caller's real inspiration notes" })
  listMyInspirationNotes(@Request() req) {
    return this.plannerService.listMyInspirationNotes(req.user.id);
  }

  @Post('events/mine/inspiration')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Add a real inspiration note to the caller's wedding" })
  addInspirationNote(@Request() req, @Body() dto: CreateInspirationNoteDto) {
    return this.plannerService.addInspirationNote(req.user.id, dto);
  }

  @Get('events/mine/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "List messages between the caller and their assigned coach" })
  listMyMessages(@Request() req) {
    return this.plannerService.listMyMessages(req.user.id);
  }

  @Post('events/mine/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: "Send a message to the caller's assigned coach" })
  sendMyMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.plannerService.sendMyMessage(req.user.id, dto);
  }

  @Get('coach/events')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List the wedding events assigned to the calling coach' })
  getCoachEvents(@Request() req) {
    assertCoach(req.user.role);
    return this.plannerService.getCoachEvents(req.user.id);
  }

  @Get('coach/events/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get a wedding event assigned to the calling coach' })
  getCoachEventDetail(@Request() req, @Param('id') id: string) {
    assertCoach(req.user.role);
    return this.plannerService.getCoachEventDetail(req.user.id, id);
  }

  @Get('coach/events/:id/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'List messages between the coach and that wedding event owner' })
  listCoachEventMessages(@Request() req, @Param('id') id: string) {
    assertCoach(req.user.role);
    return this.plannerService.listCoachEventMessages(req.user.id, id);
  }

  @Post('coach/events/:id/messages')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Send a message as the coach to that wedding event owner' })
  sendCoachEventMessage(@Request() req, @Param('id') id: string, @Body() dto: SendMessageDto) {
    assertCoach(req.user.role);
    return this.plannerService.sendCoachEventMessage(req.user.id, id, dto);
  }

  @Get('vendors')
  @ApiOperation({ summary: 'Browse the real wedding vendor catalog, optionally filtered by slot' })
  @ApiQuery({ name: 'slot', required: false })
  browseVendors(@Query('slot') slot?: string) {
    return this.plannerService.browseVendors(slot);
  }

  @Get('vendors/:slot/shortlist')
  @ApiOperation({ summary: 'Get the top-rated real vendors for a slot' })
  getVendorShortlist(@Param('slot') slot: string) {
    return this.plannerService.getVendorShortlist(slot);
  }

  @Get('vendors/:slot/alternatives')
  @ApiOperation({ summary: 'Get real alternative vendors for a slot, optionally excluding one' })
  @ApiQuery({ name: 'excludeId', required: false })
  getVendorAlternatives(@Param('slot') slot: string, @Query('excludeId') excludeId?: string) {
    return this.plannerService.getVendorAlternatives(slot, excludeId);
  }

  @Get('vendors/compare')
  @ApiOperation({ summary: 'Compare two real vendors head to head' })
  @ApiQuery({ name: 'vendorAId', required: true })
  @ApiQuery({ name: 'vendorBId', required: true })
  compareVendors(@Query('vendorAId') vendorAId: string, @Query('vendorBId') vendorBId: string) {
    return this.plannerService.compareVendors(vendorAId, vendorBId);
  }

  @Get('mvp')
  @ApiOperation({ summary: 'Get the STITCHD MVP planner data for an event type and persona' })
  @ApiQuery({ name: 'eventType', required: false, enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] })
  @ApiQuery({ name: 'persona', required: false, enum: ['client', 'supplier', 'coach', 'admin'] })
  getPlannerMvp(
    @Query('eventType') eventType?: PlannerEventType,
    @Query('persona') persona?: PlannerPersona,
  ) {
    return this.plannerService.getMvpExperience(eventType, persona);
  }

  @Get('surface')
  @ApiOperation({ summary: 'Get the richer planner client surface for an event type' })
  @ApiQuery({ name: 'eventType', required: false, enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] })
  getPlannerSurface(@Query('eventType') eventType?: PlannerEventType) {
    return this.plannerService.getSurfaceExperience(eventType);
  }

  @Post('auto-pick')
  @ApiOperation({ summary: 'Get AI auto-pick planner squad suggestions' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        eventType: { type: 'string', enum: ['wedding', 'lobola', 'funeral', 'corporate', 'birthday'] },
      },
    },
  })
  autoPick(@Body() body: { eventType?: PlannerEventType }) {
    return this.plannerService.getAutoPickExperience(body.eventType);
  }
}