import { BadRequestException, NotFoundException } from '@nestjs/common';
import { WalletReferenceType, WalletTransactionDirection } from './entities/wallet-transaction.entity';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  function createRepositoryMock() {
    return {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => value),
    };
  }

  it('credits a wallet and records the resulting balance snapshot', async () => {
    const usersRepository = createRepositoryMock();
    const walletTransactionsRepository = createRepositoryMock();
    const service = new WalletService(usersRepository as never, walletTransactionsRepository as never);

    const user = { id: 'user-1', walletBalanceCents: 2_000 };
    usersRepository.findOne.mockResolvedValue(user);
    walletTransactionsRepository.findOne.mockResolvedValue(null);
    usersRepository.save.mockImplementation(async (value) => value);
    walletTransactionsRepository.save.mockImplementation(async (value) => ({ id: 'txn-1', ...value }));

    const transaction = await service.recordTransaction({
      userId: 'user-1',
      direction: WalletTransactionDirection.CREDIT,
      amountCents: 500,
      referenceType: WalletReferenceType.MANUAL_ADJUSTMENT,
      referenceId: 'bonus-1',
      description: 'Launch bonus',
    });

    expect(usersRepository.save).toHaveBeenCalledWith(expect.objectContaining({ walletBalanceCents: 2_500 }));
    expect(transaction).toEqual(
      expect.objectContaining({
        amountCents: 500,
        balanceBeforeCents: 2_000,
        balanceAfterCents: 2_500,
      }),
    );
  });

  it('rejects debits that would push the wallet below zero', async () => {
    const usersRepository = createRepositoryMock();
    const walletTransactionsRepository = createRepositoryMock();
    const service = new WalletService(usersRepository as never, walletTransactionsRepository as never);

    usersRepository.findOne.mockResolvedValue({ id: 'user-1', walletBalanceCents: 300 });
    walletTransactionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.recordTransaction({
        userId: 'user-1',
        direction: WalletTransactionDirection.DEBIT,
        amountCents: 500,
        referenceType: WalletReferenceType.BOOKING_PAYMENT,
        referenceId: 'booking-1',
        description: 'Booking payment',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(usersRepository.save).not.toHaveBeenCalled();
    expect(walletTransactionsRepository.save).not.toHaveBeenCalled();
  });

  it('throws when the wallet owner cannot be found', async () => {
    const usersRepository = createRepositoryMock();
    const walletTransactionsRepository = createRepositoryMock();
    const service = new WalletService(usersRepository as never, walletTransactionsRepository as never);

    usersRepository.findOne.mockResolvedValue(null);
    walletTransactionsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.recordTransaction({
        userId: 'missing-user',
        direction: WalletTransactionDirection.CREDIT,
        amountCents: 500,
        referenceType: WalletReferenceType.MANUAL_ADJUSTMENT,
        referenceId: 'bonus-1',
        description: 'Launch bonus',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});