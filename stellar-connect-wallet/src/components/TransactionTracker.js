import React from 'react';
import { TX_STATUS } from './Soroban';
import './TransactionTracker.css';

const statusConfig = {
  [TX_STATUS.IDLE]: { label: '', icon: null, class: '' },
  [TX_STATUS.BUILDING]: {
    label: 'Building Transaction',
    icon: '🔨',
    class: 'tx-building',
    description: 'Preparing transaction parameters...',
  },
  [TX_STATUS.SIMULATING]: {
    label: 'Simulating',
    icon: '🧪',
    class: 'tx-simulating',
    description: 'Running simulation on Soroban RPC...',
  },
  [TX_STATUS.AWAITING_SIGNATURE]: {
    label: 'Awaiting Signature',
    icon: '✍️',
    class: 'tx-awaiting',
    description: 'Please confirm in your wallet extension',
  },
  [TX_STATUS.SUBMITTING]: {
    label: 'Submitting',
    icon: '📤',
    class: 'tx-submitting',
    description: 'Broadcasting to Stellar network...',
  },
  [TX_STATUS.PENDING]: {
    label: 'Pending Confirmation',
    icon: '⏳',
    class: 'tx-pending',
    description: 'Waiting for ledger inclusion...',
  },
  [TX_STATUS.SUCCESS]: {
    label: 'Confirmed',
    icon: '✅',
    class: 'tx-success',
    description: 'Transaction finalized on-chain',
  },
  [TX_STATUS.FAILED]: {
    label: 'Failed',
    icon: '❌',
    class: 'tx-failed',
    description: 'Transaction could not be processed',
  },
  [TX_STATUS.REJECTED]: {
    label: 'Rejected',
    icon: '🚫',
    class: 'tx-rejected',
    description: 'Transaction was declined by user',
  },
};

const TransactionTracker = ({ status, message, txHash, onClose }) => {
  if (!status || status === TX_STATUS.IDLE) return null;

  const config = statusConfig[status] || statusConfig[TX_STATUS.IDLE];
  const isActive = [TX_STATUS.BUILDING, TX_STATUS.SIMULATING, TX_STATUS.AWAITING_SIGNATURE, TX_STATUS.SUBMITTING, TX_STATUS.PENDING].includes(status);
  const isTerminal = [TX_STATUS.SUCCESS, TX_STATUS.FAILED, TX_STATUS.REJECTED].includes(status);

  const steps = [
    { key: TX_STATUS.BUILDING, label: 'Build' },
    { key: TX_STATUS.SIMULATING, label: 'Simulate' },
    { key: TX_STATUS.AWAITING_SIGNATURE, label: 'Sign' },
    { key: TX_STATUS.SUBMITTING, label: 'Submit' },
    { key: TX_STATUS.PENDING, label: 'Confirm' },
  ];

  const stepOrder = steps.map(s => s.key);
  const currentIndex = stepOrder.indexOf(status);

  return (
    <div className={`tx-tracker ${config.class}`} id="transaction-tracker">
      <div className="tx-tracker-header">
        <div className="tx-tracker-title-row">
          <span className="tx-tracker-icon">{config.icon}</span>
          <span className="tx-tracker-label">{config.label}</span>
          {isActive && <div className="tx-tracker-spinner"></div>}
        </div>
        {isTerminal && (
          <button className="tx-tracker-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Step Progress */}
      {!isTerminal && (
        <div className="tx-steps">
          {steps.map((step, i) => {
            const isDone = currentIndex > i || status === TX_STATUS.SUCCESS;
            const isCurrent = stepOrder[i] === status;
            return (
              <div key={step.key} className={`tx-step ${isDone ? 'tx-step-done' : ''} ${isCurrent ? 'tx-step-current' : ''}`}>
                <div className="tx-step-dot">
                  {isDone ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : isCurrent ? (
                    <div className="tx-step-pulse"></div>
                  ) : null}
                </div>
                <span className="tx-step-label">{step.label}</span>
                {i < steps.length - 1 && <div className={`tx-step-line ${isDone ? 'tx-step-line-done' : ''}`}></div>}
              </div>
            );
          })}
        </div>
      )}

      <p className="tx-tracker-message">{message || config.description}</p>

      {txHash && (
        <div className="tx-tracker-hash">
          <span className="tx-hash-label">TX Hash:</span>
          <a
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="tx-hash-link mono"
          >
            {txHash.slice(0, 12)}...{txHash.slice(-8)}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
};

export default TransactionTracker;
