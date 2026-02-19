import React, { useState } from 'react';
import { sendPayment, getBalance } from './Freighter';
import './SendPayment.css';

const SendPayment = ({ onBalanceUpdate }) => {
    const [destination, setDestination] = useState('');
    const [amount, setAmount] = useState('');
    const [txHash, setTxHash] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        setError('');
        setTxHash('');
        setLoading(true);

        try {
            const result = await sendPayment(destination, amount);
            setTxHash(result.hash);
            setDestination('');
            setAmount('');

            if (onBalanceUpdate) {
                const newBalance = await getBalance();
                onBalanceUpdate(Number(newBalance).toFixed(2));
            }
        } catch (err) {
            console.error('Payment error:', err);

            if (err.message?.includes('op_underfunded')) {
                setError('Insufficient balance to complete this transaction.');
            } else if (err.message?.includes('op_no_destination')) {
                setError('Destination account does not exist. Fund it first using Friendbot.');
            } else if (err.message?.includes('User declined')) {
                setError('Transaction was cancelled by user.');
            } else {
                setError(err.message || 'Transaction failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const isDisabled = loading || !destination || !amount;

    return (
        <div className="send-card">
            <div className="send-header">
                <h2 className="send-title">Send XLM</h2>
                <div className="send-badge">
                    <svg className="send-badge-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    <span className="send-badge-text">Testnet</span>
                </div>
            </div>

            <div className="send-fields">
                <div>
                    <label className="send-label">Destination Address</label>
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter Stellar public key (G...)"
                        className="send-input send-input-destination"
                    />
                </div>

                <div>
                    <label className="send-label">Amount</label>
                    <div className="send-amount-wrapper">
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="any"
                            className="send-input send-input-amount"
                        />
                        <span className="send-amount-suffix">XLM</span>
                    </div>
                </div>
            </div>

            <button
                onClick={handleSend}
                disabled={isDisabled}
                className={`send-btn ${isDisabled ? 'send-btn-disabled' : 'send-btn-active'}`}
            >
                {loading ? (
                    <span className="send-btn-inner">
                        <svg className="send-spinner" viewBox="0 0 24 24">
                            <circle className="send-spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="send-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending...
                    </span>
                ) : (
                    'Send XLM'
                )}
            </button>

            {error && (
                <div className="send-error">
                    <svg className="send-error-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <p className="send-error-text">{error}</p>
                </div>
            )}

            {txHash && (
                <div className="send-success">
                    <div className="send-success-header">
                        <svg className="send-success-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="send-success-title">Transaction Successful</p>
                    </div>
                    <div className="send-success-hash-box">
                        <p className="send-success-hash-label">Transaction Hash</p>
                        <p className="send-success-hash-value">{txHash}</p>
                    </div>
                    <a
                        href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="send-success-link"
                    >
                        View on Stellar Expert
                        <svg className="send-success-link-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                    </a>
                </div>
            )}
        </div>
    );
};

export default SendPayment;
