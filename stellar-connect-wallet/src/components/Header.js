import React, { useState } from 'react';
import { checkConnection, retrievePublicKey, getBalance } from './Freighter';
import './Header.css';

const Header = ({ connected, setConnected, publicKey, setPublicKey, balance, setBalance }) => {
    const [loading, setLoading] = useState(false);

    const connectWallet = async () => {
        setLoading(true);
        try {
            const allowed = await checkConnection();
            if(!allowed) {
                setLoading(false);
                return alert('Permission denied');
            }

            const key = await retrievePublicKey();
            const bal = await getBalance();

            setPublicKey(key);
            setBalance(Number(bal).toFixed(2));
            setConnected(true); 
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const btnClass = connected
        ? 'header-btn header-btn-connected'
        : loading
            ? 'header-btn header-btn-loading'
            : 'header-btn header-btn-connect';

    return (
        <header className="header">
            <div className="header-inner">
                <div className="header-logo">
                    <span className="header-title">Stellar Payment dApp</span>
                    <span className="header-badge">TESTNET</span>
                </div>

                <div className="header-right">
                    {connected && publicKey && (
                        <div className="header-wallet-pill">
                            <div className="header-wallet-dot"></div>
                            <span className="header-wallet-address">{`${publicKey.slice(0,6)}...${publicKey.slice(-4)}`}</span>
                            <div className="header-wallet-divider"></div>
                            <span className="header-wallet-balance">{balance} XLM</span>
                        </div>
                    )}

                    <button
                        onClick={connectWallet}
                        disabled={connected || loading}
                        className={btnClass}
                    >
                        {connected ? (
                            <span className="header-btn-inner">
                                <div className="header-connected-dot"></div>
                                Connected
                            </span>
                        ) : loading ? (
                            <span className="header-btn-inner-loading">
                                <svg className="spinner" viewBox="0 0 24 24">
                                    <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Connecting...
                            </span>
                        ) : (
                            'Connect Wallet'
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;