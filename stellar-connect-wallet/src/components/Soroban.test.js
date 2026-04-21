import {
  checkFreighterConnection,
  retrievePublicKey,
  getBalance,
  WalletNotFoundError,
  InsufficientBalanceError,
  TransactionRejectedError,
  ContractError,
} from '../components/Soroban';

// Mock Freighter API
jest.mock('@stellar/freighter-api', () => ({
  setAllowed: jest.fn(),
  getAddress: jest.fn(),
  signTransaction: jest.fn(),
}));

// Mock Stellar SDK
jest.mock('@stellar/stellar-sdk', () => {
  const actual = jest.requireActual('@stellar/stellar-sdk');
  const mockLoadAccount = jest.fn();
  const mockServer = {
    loadAccount: mockLoadAccount,
  };
  return {
    ...actual,
    Horizon: {
      Server: jest.fn(() => mockServer),
    },
    // We also need to export the mockLoadAccount so tests can use it
    __mockLoadAccount: mockLoadAccount,
  };
});

describe('Error Classes', () => {
  it('should create WalletNotFoundError', () => {
    const error = new WalletNotFoundError();
    expect(error.name).toBe('WalletNotFoundError');
    expect(error.code).toBe('WALLET_NOT_FOUND');
  });

  it('should create TransactionRejectedError', () => {
    const error = new TransactionRejectedError();
    expect(error.name).toBe('TransactionRejectedError');
    expect(error.code).toBe('TX_REJECTED');
  });

  it('should create InsufficientBalanceError', () => {
    const error = new InsufficientBalanceError();
    expect(error.name).toBe('InsufficientBalanceError');
    expect(error.code).toBe('INSUFFICIENT_BALANCE');
  });

  it('should create ContractError', () => {
    const error = new ContractError();
    expect(error.name).toBe('ContractError');
    expect(error.code).toBe('CONTRACT_ERROR');
  });

  it('should allow custom error messages', () => {
    const message = 'Custom error message';
    const error = new WalletNotFoundError(message);
    expect(error.message).toBe(message);
  });
});

describe('Contract Constants', () => {
  it('should export CONTRACT_ID', () => {
    const { CONTRACT_ID } = require('../components/Soroban');
    expect(CONTRACT_ID).toBeDefined();
    expect(typeof CONTRACT_ID).toBe('string');
  });

  it('should export TX_STATUS', () => {
    const { TX_STATUS } = require('../components/Soroban');
    expect(TX_STATUS).toHaveProperty('IDLE');
    expect(TX_STATUS).toHaveProperty('BUILDING');
    expect(TX_STATUS).toHaveProperty('SIMULATING');
    expect(TX_STATUS).toHaveProperty('AWAITING_SIGNATURE');
    expect(TX_STATUS).toHaveProperty('SUBMITTING');
    expect(TX_STATUS).toHaveProperty('PENDING');
    expect(TX_STATUS).toHaveProperty('SUCCESS');
    expect(TX_STATUS).toHaveProperty('FAILED');
    expect(TX_STATUS).toHaveProperty('REJECTED');
  });

  it('should export error classes', () => {
    expect(WalletNotFoundError).toBeDefined();
    expect(TransactionRejectedError).toBeDefined();
    expect(InsufficientBalanceError).toBeDefined();
    expect(ContractError).toBeDefined();
  });
});

describe('Wallet Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check Freighter connection', async () => {
    const { setAllowed } = require('@stellar/freighter-api');
    setAllowed.mockResolvedValueOnce(true);

    const result = await checkFreighterConnection();
    expect(result).toBe(true);
    expect(setAllowed).toHaveBeenCalled();
  });

  it('should throw WalletNotFoundError when Freighter not available', async () => {
    const { setAllowed } = require('@stellar/freighter-api');
    setAllowed.mockResolvedValueOnce(false);

    await expect(checkFreighterConnection()).rejects.toThrow(WalletNotFoundError);
  });

  it('should retrieve public key', async () => {
    const { getAddress } = require('@stellar/freighter-api');
    const mockAddress = 'GADDRESS123456789';
    getAddress.mockResolvedValueOnce({ address: mockAddress });

    const result = await retrievePublicKey();
    expect(result).toBe(mockAddress);
  });

  it('should throw error if address not returned', async () => {
    const { getAddress } = require('@stellar/freighter-api');
    getAddress.mockResolvedValueOnce({ address: null });

    await expect(retrievePublicKey()).rejects.toThrow(WalletNotFoundError);
  });

  it('should get balance for address', async () => {
    const { __mockLoadAccount } = require('@stellar/stellar-sdk');
    __mockLoadAccount.mockResolvedValueOnce({
      balances: [
        { asset_type: 'native', balance: '100.5' },
        { asset_type: 'credit_alphanum4', balance: '50.0' },
      ],
    });

    const balance = await getBalance('GADDRESS123456789');
    expect(balance).toBe('100.5');
  });

  it('should return 0 balance if native asset not found', async () => {
    const { __mockLoadAccount } = require('@stellar/stellar-sdk');
    __mockLoadAccount.mockResolvedValueOnce({
      balances: [{ asset_type: 'credit_alphanum4', balance: '50.0' }],
    });

    const balance = await getBalance('GADDRESS123456789');
    expect(balance).toBe('0');
  });

  it('should handle balance fetch errors gracefully', async () => {
    const { __mockLoadAccount } = require('@stellar/stellar-sdk');
    __mockLoadAccount.mockRejectedValueOnce(new Error('Network error'));

    const balance = await getBalance('GADDRESS123456789');
    expect(balance).toBe('0');
  });
});

describe('Integration Tests', () => {
  it('should handle complete wallet connection flow', async () => {
    const { setAllowed, getAddress } = require('@stellar/freighter-api');
    setAllowed.mockResolvedValueOnce(true);
    getAddress.mockResolvedValueOnce({ address: 'GADDRESS123456789' });

    const connected = await checkFreighterConnection();
    expect(connected).toBe(true);

    const address = await retrievePublicKey();
    expect(address).toBe('GADDRESS123456789');
  });

  it('should handle wallet disconnection flow', async () => {
    const { setAllowed } = require('@stellar/freighter-api');
    setAllowed.mockResolvedValueOnce(false);

    await expect(checkFreighterConnection()).rejects.toThrow(WalletNotFoundError);
  });
});
