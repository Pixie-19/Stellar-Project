import React, { useState } from 'react';
import {
  checkFreighterConnection,
  retrievePublicKey,
  getBalance,
  WalletNotFoundError,
} from './Soroban';
import './Header.css';

const Header = ({ connected, setConnected, publicKey, setPublicKey, balance, setBalance, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const connectFreighter = async () => {
    setLoading(true);
    try {
      await checkFreighterConnection();
      const key = await retrievePublicKey();
      const bal = await getBalance(key);

      setPublicKey(key);
      setBalance(Number(bal).toFixed(2));
      setConnected(true);
      addToast('success', 'Wallet Connected', `Connected via Freighter: ${key.slice(0, 6)}...${key.slice(-4)}`);
    } catch (err) {
      if (err instanceof WalletNotFoundError) {
        addToast('error', 'Wallet Not Found', err.message);
      } else {
        addToast('error', 'Connection Failed', err.message || 'Could not connect wallet');
      }
    } finally {
      setLoading(false);
      setWalletDropdownOpen(false);
    }
  };

  const disconnectWallet = () => {
    setConnected(false);
    setPublicKey('');
    setBalance('0');
    addToast('info', 'Disconnected', 'Wallet has been disconnected');
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(publicKey);
    addToast('success', 'Copied', 'Wallet address copied to clipboard');
  };

  const fundWithFriendbot = async () => {
    try {
      addToast('info', 'Funding...', 'Requesting testnet XLM from Friendbot');
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${publicKey}`
      );
      if (response.ok) {
        const bal = await getBalance(publicKey);
        setBalance(Number(bal).toFixed(2));
        addToast('success', 'Funded!', 'Received 10,000 testnet XLM');
      } else {
        addToast('warning', 'Already Funded', 'This account has already been funded');
      }
    } catch (err) {
      addToast('error', 'Fund Failed', 'Could not fund account via Friendbot');
    }
  };

  return (
    <header className="header" id="main-header">
      <div className="header-inner">
        <div className="header-logo">
          <div className="header-logo-icon">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 2 L28 10 L28 22 L16 30 L4 22 L4 10 Z" stroke="url(#logo-grad)" strokeWidth="2.5" />
              <path d="M16 11 L24 16 L16 21 L8 16 Z" fill="url(#logo-grad)" opacity="0.8" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32">
                  <stop offset="0%" stopColor={ "var(--accent-secondary)" } />
                  <stop offset="100%" stopColor={ "var(--accent-primary)" } />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="header-brand">
            <span className="header-title">StellarFund</span>
            <span className="header-badge">TESTNET</span>
          </div>
        </div>

        <nav className="header-nav">
          <a href="#campaigns" className="header-nav-link active">Campaigns</a>
          <a href="#create" className="header-nav-link">Create</a>
          <a href="#activity" className="header-nav-link">Activity</a>
        </nav>

        <div className="header-right">
          {connected && publicKey && (
            <div className="header-wallet-info">
              <button className="header-fund-btn" onClick={fundWithFriendbot} title="Fund with Friendbot">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" strokeLinecap="round" />
                </svg>
                Fund
              </button>

              <div className="header-wallet-pill" onClick={copyAddress} title="Click to copy address">
                <div className="header-wallet-dot"></div>
                <span className="header-wallet-address mono">
                  {`${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`}
                </span>
                <div className="header-wallet-divider"></div>
                <span className="header-wallet-balance">{balance} XLM</span>
              </div>
            </div>
          )}

          {connected ? (
            <button className="header-btn header-btn-connected" onClick={disconnectWallet}>
              <div className="header-connected-dot"></div>
              Disconnect
            </button>
          ) : (
            <div className="wallet-selector">
              <button
                className={`header-btn ${loading ? 'header-btn-loading' : 'header-btn-connect'}`}
                onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                disabled={loading}
              >
                {loading ? (
                  <span className="header-btn-inner-loading">
                    <svg className="spinner" viewBox="0 0 24 24">
                      <circle className="spinner-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connecting...
                  </span>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Connect Wallet
                  </>
                )}
              </button>

              {walletDropdownOpen && !loading && (
                <div className="wallet-dropdown">
                  <div className="wallet-dropdown-header">Select Wallet</div>
                  <button className="wallet-option" onClick={connectFreighter}>
                    <div className="wallet-option-icon freighter-icon">F</div>
                    <div className="wallet-option-info">
                      <span className="wallet-option-name">Freighter</span>
                      <span className="wallet-option-desc">Browser Extension</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="wallet-option" onClick={connectFreighter}>
                    <div className="wallet-option-icon xbull-icon">X</div>
                    <div className="wallet-option-info">
                      <span className="wallet-option-name">xBull</span>
                      <span className="wallet-option-desc">Multi-platform Wallet</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button className="wallet-option" onClick={connectFreighter}>
                    <div className="wallet-option-icon albedo-icon">A</div>
                    <div className="wallet-option-info">
                      <span className="wallet-option-name">Albedo</span>
                      <span className="wallet-option-desc">Web-based Wallet</span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;