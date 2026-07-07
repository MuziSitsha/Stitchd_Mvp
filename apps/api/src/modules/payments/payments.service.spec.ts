import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';
import { WeddingEventEntity } from '../planner/entities/wedding-event.entity';
import { WeddingVendorSelectionEntity, WeddingVendorStatus } from '../planner/entities/wedding-vendor-selection.entity';
import { PaymentStatus } from './payment-status.enum';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  function createRepositoryMock() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => value),
      count: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
  }

  function createService() {
    const usersRepository = createRepositoryMock();
    const vendorPaymentsRepository = createRepositoryMock();
    const vendorSelectionsRepository = createRepositoryMock();
    const weddingEventsRepository = createRepositoryMock();
    const adminService = {
      getEffectiveCommissionRate: jest.fn().mockResolvedValue(0.15),
    };
    const configValues: Record<string, string | undefined> = {
      'app.payfastMerchantId': '10000100',
      'app.payfastMerchantKey': '46f0cd694581a',
      'app.payfastMode': 'test',
      'app.publicApiUrl': 'http://localhost:3001',
    };
    const configService = { get: jest.fn((key: string) => configValues[key]) };
    const service = new PaymentsService(
      configService as never,
      usersRepository as never,
      vendorPaymentsRepository as never,
      vendorSelectionsRepository as never,
      weddingEventsRepository as never,
      adminService as never,
    );

    return {
      service,
      usersRepository,
      vendorPaymentsRepository,
      vendorSelectionsRepository,
      weddingEventsRepository,
      adminService,
      configValues,
    };
  }

  function buildSelection(overrides: Partial<WeddingVendorSelectionEntity> = {}) {
    return Object.assign(new WeddingVendorSelectionEntity(), {
      id: 'selection-1',
      weddingEventId: 'event-1',
      slot: 'Catering',
      subcategory: null,
      vendorName: 'Taste Affair',
      priceCents: 20_000,
      amountPaidCents: 0,
      paidAt: null,
      status: WeddingVendorStatus.SHORTLISTED,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  function buildEvent(overrides: Partial<WeddingEventEntity> = {}) {
    return Object.assign(new WeddingEventEntity(), {
      id: 'event-1',
      ownerUserId: 'owner-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  }

  describe('initiateVendorPaymentCheckout', () => {
    it('creates a pending vendor payment and returns a PayFast checkout URL for the remaining balance', async () => {
      const { service, vendorPaymentsRepository, vendorSelectionsRepository, weddingEventsRepository, usersRepository, adminService } = createService();

      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection());
      weddingEventsRepository.findOne.mockResolvedValue(buildEvent());
      usersRepository.findOne.mockResolvedValue(null);
      vendorPaymentsRepository.save.mockImplementation(async (value) => ({ id: 'vendor-payment-1', status: PaymentStatus.PENDING, ...value }));

      const result = await service.initiateVendorPaymentCheckout(
        'selection-1',
        { id: 'owner-1', role: UserRole.CUSTOMER },
        {},
      );

      expect(adminService.getEffectiveCommissionRate).toHaveBeenCalled();
      expect(result.amountCents).toBe(20_000);
      expect(result.commissionCents).toBe(3_000);
      expect(result.checkoutUrl).toContain('vendor%3Avendor-payment-1');
      expect(result.checkoutUrl).toContain('sandbox.payfast.co.za');
    });

    it('clamps a partial payment amount to the remaining balance', async () => {
      const { service, vendorPaymentsRepository, vendorSelectionsRepository, weddingEventsRepository, usersRepository } = createService();

      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection({ priceCents: 20_000, amountPaidCents: 15_000 }));
      weddingEventsRepository.findOne.mockResolvedValue(buildEvent());
      usersRepository.findOne.mockResolvedValue(null);
      vendorPaymentsRepository.save.mockImplementation(async (value) => ({ id: 'vendor-payment-1', status: PaymentStatus.PENDING, ...value }));

      const result = await service.initiateVendorPaymentCheckout(
        'selection-1',
        { id: 'owner-1', role: UserRole.CUSTOMER },
        { amountCents: 999_999 },
      );

      expect(result.amountCents).toBe(5_000);
    });

    it('rejects with 400 when the vendor selection is already paid in full', async () => {
      const { service, vendorSelectionsRepository, weddingEventsRepository } = createService();

      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection({ priceCents: 20_000, amountPaidCents: 20_000 }));
      weddingEventsRepository.findOne.mockResolvedValue(buildEvent());

      await expect(
        service.initiateVendorPaymentCheckout('selection-1', { id: 'owner-1', role: UserRole.CUSTOMER }, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('degrades gracefully with 403 when PayFast credentials are not configured', async () => {
      const { service, vendorSelectionsRepository, weddingEventsRepository, configValues } = createService();

      configValues['app.payfastMerchantId'] = undefined;
      configValues['app.payfastMerchantKey'] = undefined;
      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection());
      weddingEventsRepository.findOne.mockResolvedValue(buildEvent());

      await expect(
        service.initiateVendorPaymentCheckout('selection-1', { id: 'owner-1', role: UserRole.CUSTOMER }, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects with 403 when the actor is neither the event owner nor an admin', async () => {
      const { service, vendorSelectionsRepository, weddingEventsRepository } = createService();

      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection());
      weddingEventsRepository.findOne.mockResolvedValue(buildEvent());

      await expect(
        service.initiateVendorPaymentCheckout('selection-1', { id: 'someone-else', role: UserRole.CUSTOMER }, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('confirmPayfastWebhook', () => {
    it('routes a vendor:-prefixed m_payment_id to the vendor payment path', async () => {
      const { service, vendorPaymentsRepository, vendorSelectionsRepository } = createService();

      vendorPaymentsRepository.findOne.mockResolvedValue({
        id: 'vendor-payment-1',
        vendorSelectionId: 'selection-1',
        amountCents: 5_000,
        status: PaymentStatus.PENDING,
      });
      vendorPaymentsRepository.save.mockImplementation(async (value) => value);
      vendorSelectionsRepository.findOne.mockResolvedValue(buildSelection({ priceCents: 20_000, amountPaidCents: 15_000 }));
      vendorSelectionsRepository.save.mockImplementation(async (value) => value);

      const result = await service.confirmPayfastWebhook({
        m_payment_id: 'vendor:vendor-payment-1',
        payment_status: 'COMPLETE',
        pf_payment_id: 'pf-123',
      });

      expect(result).toEqual({ received: true, status: PaymentStatus.PAID });
      expect(vendorSelectionsRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ amountPaidCents: 20_000, paidAt: expect.any(Date) }),
      );
    });

    it('ignores an m_payment_id that is not vendor-prefixed', async () => {
      const { service, vendorPaymentsRepository } = createService();

      const result = await service.confirmPayfastWebhook({
        m_payment_id: 'some-other-id',
        payment_status: 'COMPLETE',
      });

      expect(vendorPaymentsRepository.findOne).not.toHaveBeenCalled();
      expect(result).toEqual({ received: true, ignored: true });
    });
  });
});
