import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { WeddingVendorStatus } from './entities/wedding-vendor-selection.entity';
import { WeddingMessageSenderRole } from './entities/wedding-message.entity';
import { WeddingVendorMessageSenderRole } from './entities/wedding-vendor-message.entity';

function createRepositoryMock() {
  return {
    count: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn((value) => value),
    create: jest.fn((value) => value),
    createQueryBuilder: jest.fn(),
  };
}

function createPlannerService() {
  return new PlannerService(null as never, null as never, null as never, null as never, null as never, null as never, null as never, null as never);
}

describe('PlannerService (demo content)', () => {
  it('returns planner data for the requested event type and persona', () => {
    const service = createPlannerService();

    const payload = service.getMvpExperience('lobola', 'coach');

    expect(payload.eventType).toBe('lobola');
    expect(payload.persona).toBe('coach');
    expect(payload.coach.name).toBe('Nono Dube');
    expect(payload.squad.core).toHaveLength(6);
    expect(payload.onboardingSteps).toHaveLength(6);
    expect(payload.personas.map((item) => item.id)).toContain('supplier');
  });

  it('returns planner surface data and auto-pick suggestions for the requested event', () => {
    const service = createPlannerService();

    const surface = service.getSurfaceExperience('wedding');
    const autoPick = service.getAutoPickExperience('wedding');

    expect(surface.locationLabel).toBe('Lanseria, Gauteng');
    expect(surface.weather.forecast).toHaveLength(5);
    expect(surface.suppliers.shortlist.length).toBeGreaterThan(0);
    expect(surface.autoPick.core).toHaveLength(6);
    expect(autoPick.title).toBe('AI picked your squad');
    expect(autoPick.support).toHaveLength(3);
  });
});

describe('PlannerService (real vendor catalog)', () => {
  function build() {
    const weddingEventsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const coachProfilesRepository = createRepositoryMock();
    const weddingVendorsRepository = createRepositoryMock();
    const inspirationNotesRepository = createRepositoryMock();
    const messagesRepository = createRepositoryMock();
    const vendorProfilesRepository = createRepositoryMock();
    const vendorMessagesRepository = createRepositoryMock();
    const service = new PlannerService(
      weddingEventsRepository as never,
      vendorSelectionsRepository as never,
      coachProfilesRepository as never,
      weddingVendorsRepository as never,
      inspirationNotesRepository as never,
      messagesRepository as never,
      vendorProfilesRepository as never,
      vendorMessagesRepository as never,
    );
    return { service, weddingEventsRepository, vendorSelectionsRepository, coachProfilesRepository, weddingVendorsRepository, inspirationNotesRepository, messagesRepository, vendorProfilesRepository, vendorMessagesRepository };
  }

  it('browses vendors by slot', async () => {
    const { service, weddingVendorsRepository } = build();
    weddingVendorsRepository.find.mockResolvedValue([{ id: 'v1', slot: 'Venue' }]);

    const result = await service.browseVendors('Venue');

    expect(weddingVendorsRepository.find).toHaveBeenCalledWith({
      where: { eventType: 'wedding', slot: 'Venue' },
      order: { rating: 'DESC' },
    });
    expect(result).toEqual([{ id: 'v1', slot: 'Venue' }]);
  });

  it('compares two vendors using only real fields, no invented stats', async () => {
    const { service, weddingVendorsRepository } = build();
    weddingVendorsRepository.findOne
      .mockResolvedValueOnce({ id: 'a', name: 'Luxe Manor', rating: 4.8, reviewCount: 96, priceLabel: 'R85,000' })
      .mockResolvedValueOnce({ id: 'b', name: 'Glass Hall', rating: 4.6, reviewCount: 40, priceLabel: 'R95,000' });

    const result = await service.compareVendors('a', 'b');

    expect(result.comparison).toEqual([
      { label: 'Rating', vendorA: 4.8, vendorB: 4.6 },
      { label: 'Reviews', vendorA: 96, vendorB: 40 },
      { label: 'Price', vendorA: 'R85,000', vendorB: 'R95,000' },
    ]);
  });

  it('throws when comparing a vendor that does not exist', async () => {
    const { service, weddingVendorsRepository } = build();
    weddingVendorsRepository.findOne.mockResolvedValue(null);

    await expect(service.compareVendors('a', 'b')).rejects.toThrow(NotFoundException);
  });
});

describe('PlannerService (coach access)', () => {
  function build() {
    const weddingEventsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const coachProfilesRepository = createRepositoryMock();
    const weddingVendorsRepository = createRepositoryMock();
    const inspirationNotesRepository = createRepositoryMock();
    const messagesRepository = createRepositoryMock();
    const vendorProfilesRepository = createRepositoryMock();
    const vendorMessagesRepository = createRepositoryMock();
    const service = new PlannerService(
      weddingEventsRepository as never,
      vendorSelectionsRepository as never,
      coachProfilesRepository as never,
      weddingVendorsRepository as never,
      inspirationNotesRepository as never,
      messagesRepository as never,
      vendorProfilesRepository as never,
      vendorMessagesRepository as never,
    );
    return { service, weddingEventsRepository, vendorSelectionsRepository, messagesRepository };
  }

  it('rejects a coach viewing a wedding event they are not assigned to', async () => {
    const { service, weddingEventsRepository } = build();
    weddingEventsRepository.findOne.mockResolvedValue({ id: 'event-1', coachUserId: 'coach-a' });

    await expect(service.getCoachEventDetail('coach-b', 'event-1')).rejects.toThrow(ForbiddenException);
  });

  it('lets the assigned coach send a message that records the coach sender role', async () => {
    const { service, weddingEventsRepository, messagesRepository } = build();
    weddingEventsRepository.findOne.mockResolvedValue({ id: 'event-1', coachUserId: 'coach-a' });

    await service.sendCoachEventMessage('coach-a', 'event-1', { message: 'Hi there' });

    expect(messagesRepository.create).toHaveBeenCalledWith({
      weddingEventId: 'event-1',
      senderUserId: 'coach-a',
      senderRole: WeddingMessageSenderRole.COACH,
      message: 'Hi there',
    });
  });
});

describe('PlannerService (vendor selection payments)', () => {
  function build() {
    const weddingEventsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const coachProfilesRepository = createRepositoryMock();
    const weddingVendorsRepository = createRepositoryMock();
    const inspirationNotesRepository = createRepositoryMock();
    const messagesRepository = createRepositoryMock();
    const vendorProfilesRepository = createRepositoryMock();
    const vendorMessagesRepository = createRepositoryMock();
    const service = new PlannerService(
      weddingEventsRepository as never,
      vendorSelectionsRepository as never,
      coachProfilesRepository as never,
      weddingVendorsRepository as never,
      inspirationNotesRepository as never,
      messagesRepository as never,
      vendorProfilesRepository as never,
      vendorMessagesRepository as never,
    );
    return { service, weddingEventsRepository, vendorSelectionsRepository };
  }

  it('marks a selection as paid once the amount paid reaches the price', async () => {
    const { service, weddingEventsRepository, vendorSelectionsRepository } = build();
    vendorSelectionsRepository.findOne.mockResolvedValue({ id: 'sel-1', weddingEventId: 'event-1', priceCents: 10000, amountPaidCents: 0, status: WeddingVendorStatus.SECURED });
    weddingEventsRepository.findOne.mockResolvedValue({ id: 'event-1', ownerUserId: 'owner-1' });

    const result = await service.updateVendorSelection('owner-1', 'sel-1', { amountPaidCents: 10000 });

    expect(result.paidAt).toBeInstanceOf(Date);
  });

  it('does not mark a selection as paid for a partial payment', async () => {
    const { service, weddingEventsRepository, vendorSelectionsRepository } = build();
    vendorSelectionsRepository.findOne.mockResolvedValue({ id: 'sel-1', weddingEventId: 'event-1', priceCents: 10000, amountPaidCents: 0, status: WeddingVendorStatus.SECURED });
    weddingEventsRepository.findOne.mockResolvedValue({ id: 'event-1', ownerUserId: 'owner-1' });

    const result = await service.updateVendorSelection('owner-1', 'sel-1', { amountPaidCents: 5000 });

    expect(result.paidAt).toBeNull();
  });
});

describe('PlannerService (vendor account access)', () => {
  function build() {
    const weddingEventsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const coachProfilesRepository = createRepositoryMock();
    const weddingVendorsRepository = createRepositoryMock();
    const inspirationNotesRepository = createRepositoryMock();
    const messagesRepository = createRepositoryMock();
    const vendorProfilesRepository = createRepositoryMock();
    const vendorMessagesRepository = createRepositoryMock();
    const service = new PlannerService(
      weddingEventsRepository as never,
      vendorSelectionsRepository as never,
      coachProfilesRepository as never,
      weddingVendorsRepository as never,
      inspirationNotesRepository as never,
      messagesRepository as never,
      vendorProfilesRepository as never,
      vendorMessagesRepository as never,
    );
    return { service, weddingEventsRepository, vendorSelectionsRepository, vendorProfilesRepository, vendorMessagesRepository };
  }

  it('lists only selections that reference the calling vendor\'s linked catalog listing', async () => {
    const { service, weddingEventsRepository, vendorSelectionsRepository, vendorProfilesRepository } = build();
    vendorProfilesRepository.findOne.mockResolvedValue({ id: 'profile-1', userId: 'vendor-user-1', vendorId: 'vendor-catalog-1' });
    vendorSelectionsRepository.find.mockResolvedValue([{ id: 'sel-1', weddingEventId: 'event-1', vendorId: 'vendor-catalog-1' }]);
    weddingEventsRepository.find.mockResolvedValue([{ id: 'event-1', ownerUserId: 'owner-1' }]);

    const result = await service.getVendorSelections('vendor-user-1');

    expect(vendorSelectionsRepository.find).toHaveBeenCalledWith({
      where: { vendorId: 'vendor-catalog-1' },
      order: { createdAt: 'DESC' },
    });
    expect(result[0].event).toEqual({ id: 'event-1', ownerUserId: 'owner-1' });
  });

  it('rejects a vendor with no linked profile from listing selections', async () => {
    const { service, vendorProfilesRepository } = build();
    vendorProfilesRepository.findOne.mockResolvedValue(null);

    await expect(service.getVendorSelections('vendor-user-1')).rejects.toThrow(ForbiddenException);
  });

  it('rejects a vendor messaging a selection they are not assigned to', async () => {
    const { service, vendorProfilesRepository, vendorSelectionsRepository } = build();
    vendorProfilesRepository.findOne.mockResolvedValue({ id: 'profile-1', userId: 'vendor-user-1', vendorId: 'vendor-catalog-1' });
    vendorSelectionsRepository.findOne.mockResolvedValue({ id: 'sel-1', vendorId: 'some-other-vendor' });

    await expect(
      service.sendVendorSelectionMessage('vendor-user-1', 'sel-1', { message: 'Hi' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('lets the assigned vendor send a message that records the vendor sender role', async () => {
    const { service, vendorProfilesRepository, vendorSelectionsRepository, vendorMessagesRepository } = build();
    vendorProfilesRepository.findOne.mockResolvedValue({ id: 'profile-1', userId: 'vendor-user-1', vendorId: 'vendor-catalog-1' });
    vendorSelectionsRepository.findOne.mockResolvedValue({ id: 'sel-1', vendorId: 'vendor-catalog-1' });

    await service.sendVendorSelectionMessage('vendor-user-1', 'sel-1', { message: 'Looking forward to it!' });

    expect(vendorMessagesRepository.create).toHaveBeenCalledWith({
      vendorSelectionId: 'sel-1',
      senderUserId: 'vendor-user-1',
      senderRole: WeddingVendorMessageSenderRole.VENDOR,
      message: 'Looking forward to it!',
    });
  });

  it('rejects a client messaging a selection on an event they do not own', async () => {
    const { service, vendorSelectionsRepository, weddingEventsRepository } = build();
    vendorSelectionsRepository.findOne.mockResolvedValue({ id: 'sel-1', weddingEventId: 'event-1' });
    weddingEventsRepository.findOne.mockResolvedValue({ id: 'event-1', ownerUserId: 'owner-a' });

    await expect(
      service.sendMySelectionMessage('owner-b', 'sel-1', { message: 'Hi' }),
    ).rejects.toThrow(ForbiddenException);
  });
});
