import * as StellarSdk from '@stellar/stellar-sdk';
import { signTransaction, setAllowed, getAddress } from '@stellar/freighter-api';

// ═══════════════════════════════════════════════════════════════════
//  STELLAR SOROBAN CONTRACT INTEGRATION
//  Crowdfunding Smart Contract Interface
// ═══════════════════════════════════════════════════════════════════

const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';
const HORIZON_URL = 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

// Deployed Crowdfund Contract Address on Testnet
// This contract was deployed using: stellar contract deploy --wasm crowdfund.wasm --network testnet
const CONTRACT_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGZN3';

const horizonServer = new StellarSdk.Horizon.Server(HORIZON_URL);

// ═══════════════════════ ERROR TYPES ═══════════════════════════════

export class WalletNotFoundError extends Error {
  constructor(message = 'Freighter wallet extension not detected. Please install Freighter to continue.') {
    super(message);
    this.name = 'WalletNotFoundError';
    this.code = 'WALLET_NOT_FOUND';
  }
}

export class TransactionRejectedError extends Error {
  constructor(message = 'Transaction was rejected by the user in their wallet.') {
    super(message);
    this.name = 'TransactionRejectedError';
    this.code = 'TX_REJECTED';
  }
}

export class InsufficientBalanceError extends Error {
  constructor(message = 'Insufficient XLM balance to complete this transaction.') {
    super(message);
    this.name = 'InsufficientBalanceError';
    this.code = 'INSUFFICIENT_BALANCE';
  }
}

export class ContractError extends Error {
  constructor(message = 'Smart contract interaction failed.') {
    super(message);
    this.name = 'ContractError';
    this.code = 'CONTRACT_ERROR';
  }
}

// ═══════════════════ WALLET FUNCTIONS ══════════════════════════════

/**
 * Check if Freighter wallet is available and connect
 */
export const checkFreighterConnection = async () => {
  try {
    const result = await setAllowed();
    if (!result) {
      throw new WalletNotFoundError();
    }
    return true;
  } catch (err) {
    if (err instanceof WalletNotFoundError) throw err;
    throw new WalletNotFoundError('Failed to connect to Freighter. Make sure the extension is installed and enabled.');
  }
};

/**
 * Retrieve the connected wallet's public key
 */
export const retrievePublicKey = async () => {
  try {
    const { address } = await getAddress();
    if (!address) throw new WalletNotFoundError('No wallet address returned. Please unlock Freighter.');
    return address;
  } catch (err) {
    if (err.name === 'WalletNotFoundError') throw err;
    throw new WalletNotFoundError('Could not retrieve wallet address. Is Freighter unlocked?');
  }
};

/**
 * Get XLM balance for the connected wallet
 */
export const getBalance = async (publicKey) => {
  try {
    const key = publicKey || await retrievePublicKey();
    const account = await horizonServer.loadAccount(key);
    const xlm = account.balances.find((b) => b.asset_type === 'native');
    return xlm ? xlm.balance : '0';
  } catch (err) {
    if (err.name === 'WalletNotFoundError') throw err;
    console.error('Balance fetch error:', err);
    return '0';
  }
};

// ═══════════════════ TRANSACTION HELPERS ═══════════════════════════

/**
 * Transaction status types for real-time tracking
 */
export const TX_STATUS = {
  IDLE: 'idle',
  BUILDING: 'building',
  SIMULATING: 'simulating',
  AWAITING_SIGNATURE: 'awaiting_signature',
  SUBMITTING: 'submitting',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REJECTED: 'rejected',
};

/**
 * Build, simulate, sign, and submit a Soroban contract invocation
 */
export const invokeContract = async (
  functionName,
  args = [],
  onStatusChange = () => {},
  requiresAuth = true
) => {
  try {
    onStatusChange(TX_STATUS.BUILDING, 'Building transaction...');

    const publicKey = await retrievePublicKey();
    const account = await horizonServer.loadAccount(publicKey);

    // Build the transaction
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    txBuilder.addOperation(contract.call(functionName, ...args));
    txBuilder.setTimeout(60);

    const transaction = txBuilder.build();

    onStatusChange(TX_STATUS.SIMULATING, 'Simulating transaction...');

    // Simulate with Soroban RPC
    const rpc = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
    const simulated = await rpc.simulateTransaction(transaction);

    if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
      throw new ContractError(
        `Simulation failed: ${simulated.error || 'Unknown simulation error'}`
      );
    }

    // For read-only calls, return the result directly
    if (!requiresAuth) {
      const returnValue = simulated.result?.retval;
      onStatusChange(TX_STATUS.SUCCESS, 'Read completed');
      return { result: returnValue, hash: null, status: TX_STATUS.SUCCESS };
    }

    // Assemble the transaction with simulated data
    const assembledTx = StellarSdk.rpc.assembleTransaction(transaction, simulated).build();

    onStatusChange(TX_STATUS.AWAITING_SIGNATURE, 'Please sign in your wallet...');

    // Sign with Freighter
    let signedXdr;
    try {
      const xdr = assembledTx.toXDR();
      const signedResponse = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      signedXdr = signedResponse.signedTxXdr;
    } catch (signErr) {
      if (signErr.message?.includes('User declined') || signErr.message?.includes('rejected')) {
        throw new TransactionRejectedError();
      }
      throw signErr;
    }

    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      NETWORK_PASSPHRASE
    );

    onStatusChange(TX_STATUS.SUBMITTING, 'Submitting transaction...');

    // Submit to RPC
    const sendResponse = await rpc.sendTransaction(signedTransaction);

    if (sendResponse.status === 'ERROR') {
      throw new ContractError(`Transaction submission failed: ${sendResponse.errorResult}`);
    }

    onStatusChange(TX_STATUS.PENDING, 'Waiting for confirmation...');

    // Poll for completion
    const txHash = sendResponse.hash;
    let getResponse;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      getResponse = await rpc.getTransaction(txHash);

      if (getResponse.status !== 'NOT_FOUND') {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts++;
    }

    if (!getResponse || getResponse.status === 'NOT_FOUND') {
      throw new ContractError('Transaction timed out. Please check explorer for status.');
    }

    if (getResponse.status === 'SUCCESS') {
      onStatusChange(TX_STATUS.SUCCESS, 'Transaction confirmed!');

      // Extract return value
      const resultMetaXdr = getResponse.resultMetaXdr;
      let returnValue = null;
      if (resultMetaXdr) {
        try {
          const meta = resultMetaXdr;
          returnValue = meta.v3().sorobanMeta().returnValue();
        } catch (e) {
          console.warn('Could not parse return value:', e);
        }
      }

      return {
        result: returnValue,
        hash: txHash,
        status: TX_STATUS.SUCCESS,
      };
    } else {
      throw new ContractError(
        `Transaction failed with status: ${getResponse.status}`
      );
    }
  } catch (err) {
    // Classify errors
    if (err instanceof WalletNotFoundError ||
        err instanceof TransactionRejectedError ||
        err instanceof InsufficientBalanceError ||
        err instanceof ContractError) {
      onStatusChange(TX_STATUS.FAILED, err.message);
      throw err;
    }

    if (err.message?.includes('op_underfunded') || err.message?.includes('insufficient')) {
      const balErr = new InsufficientBalanceError();
      onStatusChange(TX_STATUS.FAILED, balErr.message);
      throw balErr;
    }

    if (err.message?.includes('User declined') || err.message?.includes('rejected')) {
      const rejErr = new TransactionRejectedError();
      onStatusChange(TX_STATUS.REJECTED, rejErr.message);
      throw rejErr;
    }

    const genericErr = new ContractError(err.message || 'Unknown error occurred');
    onStatusChange(TX_STATUS.FAILED, genericErr.message);
    throw genericErr;
  }
};

// ═══════════════════ CONTRACT FUNCTIONS ════════════════════════════

/**
 * Create a new crowdfunding campaign via smart contract
 */
export const createCampaign = async (title, description, targetAmount, deadline, onStatusChange) => {
  const publicKey = await retrievePublicKey();

  const args = [
    new StellarSdk.Address(publicKey).toScVal(),
    StellarSdk.nativeToScVal(title, { type: 'string' }),
    StellarSdk.nativeToScVal(description, { type: 'string' }),
    StellarSdk.nativeToScVal(BigInt(Math.floor(targetAmount * 10000000)), { type: 'i128' }),
    StellarSdk.nativeToScVal(deadline, { type: 'u64' }),
  ];

  return invokeContract('create_campaign', args, onStatusChange, true);
};

/**
 * Donate to a campaign via smart contract
 */
export const donateToCampaign = async (campaignId, amount, onStatusChange) => {
  const publicKey = await retrievePublicKey();
  const xlmContractAddress = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2OOTGZN3';

  const args = [
    new StellarSdk.Address(publicKey).toScVal(),
    StellarSdk.nativeToScVal(campaignId, { type: 'u32' }),
    StellarSdk.nativeToScVal(BigInt(Math.floor(amount * 10000000)), { type: 'i128' }),
    new StellarSdk.Address(xlmContractAddress).toScVal(),
  ];

  return invokeContract('donate', args, onStatusChange, true);
};

/**
 * Get campaign details from contract (read-only)
 */
export const getCampaignFromContract = async (campaignId, onStatusChange = () => {}) => {
  const args = [
    StellarSdk.nativeToScVal(campaignId, { type: 'u32' }),
  ];

  return invokeContract('get_campaign', args, onStatusChange, false);
};

/**
 * Get campaign count from contract (read-only)
 */
export const getCampaignCount = async (onStatusChange = () => {}) => {
  return invokeContract('get_campaign_count', [], onStatusChange, false);
};

// ═══════════════════ PAYMENT FUNCTIONS ═════════════════════════════

/**
 * Send XLM payment (direct Stellar payment, no contract)
 */
export const sendPayment = async (destination, amount, onStatusChange = () => {}) => {
  try {
    onStatusChange(TX_STATUS.BUILDING, 'Building payment...');

    // Validate
    if (!StellarSdk.StrKey.isValidEd25519PublicKey(destination)) {
      throw new ContractError('Invalid Stellar address');
    }
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      throw new ContractError('Amount must be greater than 0');
    }

    const publicKey = await retrievePublicKey();
    const account = await horizonServer.loadAccount(publicKey);

    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination,
          asset: StellarSdk.Asset.native(),
          amount: String(amount),
        })
      )
      .setTimeout(30)
      .build();

    onStatusChange(TX_STATUS.AWAITING_SIGNATURE, 'Please sign in your wallet...');

    const xdr = transaction.toXDR();
    let signedXdr;
    try {
      const signedResponse = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
      });
      signedXdr = signedResponse.signedTxXdr;
    } catch (signErr) {
      if (signErr.message?.includes('User declined')) {
        throw new TransactionRejectedError();
      }
      throw signErr;
    }

    onStatusChange(TX_STATUS.SUBMITTING, 'Submitting payment...');

    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      NETWORK_PASSPHRASE
    );
    const result = await horizonServer.submitTransaction(signedTransaction);

    onStatusChange(TX_STATUS.SUCCESS, 'Payment confirmed!');

    return {
      hash: result.hash,
      status: TX_STATUS.SUCCESS,
    };
  } catch (err) {
    if (err instanceof TransactionRejectedError) {
      onStatusChange(TX_STATUS.REJECTED, err.message);
      throw err;
    }
    if (err.message?.includes('op_underfunded')) {
      const balErr = new InsufficientBalanceError();
      onStatusChange(TX_STATUS.FAILED, balErr.message);
      throw balErr;
    }
    if (err.message?.includes('op_no_destination')) {
      const destErr = new ContractError('Destination account does not exist. Fund it via Friendbot first.');
      onStatusChange(TX_STATUS.FAILED, destErr.message);
      throw destErr;
    }
    const genericErr = new ContractError(err.message || 'Payment failed');
    onStatusChange(TX_STATUS.FAILED, genericErr.message);
    throw genericErr;
  }
};

// ═══════════════════ EVENT STREAMING ═══════════════════════════════

/**
 * Stream payment events for real-time updates via Horizon
 */
export const streamPayments = (publicKey, onPayment) => {
  const es = horizonServer
    .payments()
    .forAccount(publicKey)
    .cursor('now')
    .stream({
      onmessage: (payment) => {
        if (payment.type === 'payment' || payment.type === 'create_account') {
          onPayment({
            id: payment.id,
            type: payment.type,
            from: payment.from || payment.funder,
            to: payment.to || payment.account,
            amount: payment.amount || payment.starting_balance,
            asset: payment.asset_type === 'native' ? 'XLM' : payment.asset_code,
            timestamp: payment.created_at,
            hash: payment.transaction_hash,
          });
        }
      },
      onerror: (err) => {
        console.error('Payment stream error:', err);
      },
    });

  return es; // Return the EventSource for cleanup
};

/**
 * Stream account effects for real-time balance updates
 */
export const streamEffects = (publicKey, onEffect) => {
  const es = horizonServer
    .effects()
    .forAccount(publicKey)
    .cursor('now')
    .stream({
      onmessage: (effect) => {
        onEffect({
          id: effect.id,
          type: effect.type,
          account: effect.account,
          amount: effect.amount,
          timestamp: effect.created_at,
        });
      },
      onerror: (err) => {
        console.error('Effects stream error:', err);
      },
    });

  return es;
};

/**
 * Poll Soroban contract events for real-time updates
 */
export const pollContractEvents = async (startLedger = null) => {
  try {
    const rpc = new StellarSdk.rpc.Server(SOROBAN_RPC_URL);
    const latestLedger = await rpc.getLatestLedger();
    const start = startLedger || latestLedger.sequence - 100;

    const events = await rpc.getEvents({
      startLedger: start,
      filters: [
        {
          type: 'contract',
          contractIds: [CONTRACT_ID],
        },
      ],
      limit: 50,
    });

    return {
      events: events.events || [],
      latestLedger: latestLedger.sequence,
    };
  } catch (err) {
    console.warn('Event polling error:', err);
    return { events: [], latestLedger: null };
  }
};

export { CONTRACT_ID, NETWORK_PASSPHRASE, SOROBAN_RPC_URL, HORIZON_URL };
