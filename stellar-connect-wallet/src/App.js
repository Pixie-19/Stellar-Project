import './App.css';
import React, { useState } from 'react';
import Header from './components/Header';
import SendPayment from './components/SendPayment';

function App() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0');

  return (
    <div className="app">
      <Header
        connected={connected}
        setConnected={setConnected}
        publicKey={publicKey}
        setPublicKey={setPublicKey}
        balance={balance}
        setBalance={setBalance}
      />

      <main className="app-main">
        {connected ? (
          <>
            <div className="wallet-card">
              <h2 className="wallet-card-title">Stellar Wallet</h2>
              <div className="wallet-card-inner">
                <div>
                  <p className="wallet-card-label">Public Key</p>
                  <p className="wallet-card-pubkey">{publicKey}</p>
                </div>
                <div className="wallet-card-divider">
                  <p className="wallet-card-label">Balance</p>
                  <p className="wallet-card-balance">{balance} <span className="wallet-card-balance-unit">XLM</span></p>
                </div>
              </div>
            </div>

            <SendPayment onBalanceUpdate={setBalance} />
          </>
        ) : (
          <div className="welcome">
            <div className="welcome-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokep="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <h2 className="welcome-title">Welcome to Stellar dApp</h2>
            <p className="welcome-text">
              Connect your Freighter wallet to view your balance and send XLM on the Stellar Testnet.
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p className="app-footer-text">Stellar Testnet · Built with Freighter</p>
      </footer>
    </div>
  );
}

export default App;
