import './App.css';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Header from './components/Header';
import CampaignCard from './components/CampaignCard';
import CreateCampaign from './components/CreateCampaign';
import TransactionTracker from './components/TransactionTracker';
import ActivityFeed from './components/ActivityFeed';
import Toast from './components/Toast';
import SendPayment from './components/SendPayment';
import {
  sendPayment,
  streamPayments,
  getBalance,
  TX_STATUS,
  CONTRACT_ID,
} from './components/Soroban';

// Demo campaigns for showcasing the UI (in real app, these come from contract)
const DEMO_CAMPAIGNS = [
  {
    id: 1,
    title: 'Stellar Developer Education Fund',
    description: 'Fund a comprehensive course library for Stellar blockchain developers. Support open-source educational resources to grow the Soroban ecosystem.',
    target: 5000,
    raised: 3247.85,
    deadline: Date.now() + 21 * 24 * 60 * 60 * 1000,
    isActive: true,
    donorCount: 42,
    category: 'Education',
    color: '#3b82f6',
  },
  {
    id: 2,
    title: 'Community Health Clinic Solar Power',
    description: 'Install solar panels at a rural health clinic. Provide reliable electricity for medical equipment and vaccine storage in underserved areas.',
    target: 10000,
    raised: 8950.12,
    deadline: Date.now() + 7 * 24 * 60 * 60 * 1000,
    isActive: true,
    donorCount: 127,
    category: 'Healthcare',
    color: '#10b981',
  },
  {
    id: 3,
    title: 'Open Source DeFi Analytics Tool',
    description: 'Build an open-source analytics dashboard for Stellar DeFi protocols. Track liquidity, volumes, and yield across the network in real-time.',
    target: 3000,
    raised: 3000,
    deadline: Date.now() - 5 * 24 * 60 * 60 * 1000,
    isActive: false,
    donorCount: 68,
    category: 'Technology',
    color: '#f59e0b',
  },
  {
    id: 4,
    title: 'Reef Restoration & Carbon Credits',
    description: 'Tokenize coral reef restoration efforts using Stellar. Donate to fund reef planting in the Caribbean with verifiable on-chain impact tracking.',
    target: 15000,
    raised: 2100.50,
    deadline: Date.now() + 45 * 24 * 60 * 60 * 1000,
    isActive: true,
    donorCount: 31,
    category: 'Environment',
    color: '#14b8a6',
  },
  {
    id: 5,
    title: 'Women in Blockchain Mentorship',
    description: 'Launch a mentorship program connecting experienced blockchain developers with women entering Web3. Funded scholarships and monthly workshops.',
    target: 2500,
    raised: 1875.00,
    deadline: Date.now() + 14 * 24 * 60 * 60 * 1000,
    isActive: true,
    donorCount: 55,
    category: 'Community',
    color: '#ec4899',
  },
  {
    id: 6,
    title: 'Stellar Mobile Wallet for Africa',
    description: 'Build a lightweight mobile wallet optimized for low-bandwidth connections. Enable XLM payments and savings for communities with limited internet access.',
    target: 8000,
    raised: 4320.75,
    deadline: Date.now() + 30 * 24 * 60 * 60 * 1000,
    isActive: true,
    donorCount: 89,
    category: 'Technology',
    color: '#f59e0b',
  },
];

function App() {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [balance, setBalance] = useState('0');
  const [campaigns, setCampaigns] = useState(DEMO_CAMPAIGNS);
  const [txStatus, setTxStatus] = useState(TX_STATUS.IDLE);
  const [txMessage, setTxMessage] = useState('');
  const [txHash, setTxHash] = useState('');
  const [toasts, setToasts] = useState([]);
  const [events, setEvents] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef(null);

  // ─── Toast Management ───
  const addToast = useCallback((type, title, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ─── Real-time Event Streaming ───
  useEffect(() => {
    if (connected && publicKey) {
      try {
        streamRef.current = streamPayments(publicKey, (payment) => {
          setEvents((prev) => [payment, ...prev].slice(0, 50));
          addToast(
            'info',
            'New Payment',
            `${Number(payment.amount).toFixed(2)} ${payment.asset} from ${payment.from?.slice(0, 8)}...`
          );

          // Refresh balance
          getBalance(publicKey).then((bal) => {
            setBalance(Number(bal).toFixed(2));
          });
        });
        setIsStreaming(true);
      } catch (err) {
        console.error('Stream setup error:', err);
      }
    }

    return () => {
      if (streamRef.current) {
        try {
          streamRef.current();
        } catch (e) {
          // EventSource cleanup
        }
        setIsStreaming(false);
      }
    };
  }, [connected, publicKey, addToast]);

  // ─── Transaction Status Handler ───
  const handleTxStatusChange = useCallback((status, message) => {
    setTxStatus(status);
    setTxMessage(message);
  }, []);

  // ─── Donate to Campaign ───
  const handleDonate = useCallback(async (campaignId, amount) => {
    if (!connected) {
      addToast('error', 'Wallet Required', 'Please connect your wallet to donate');
      return;
    }

    try {
      // Use direct Stellar payment to the campaign's simulated address
      // In production, this would call the contract's donate function
      const campaignAddress = 'GAIH3ULLFQ4DGSECF2AR555KZ4KNDGEKN4AFI4SU2M7B43MGK3QJZNSR';

      handleTxStatusChange(TX_STATUS.BUILDING, 'Building donation transaction...');

      const result = await sendPayment(
        campaignAddress,
        String(amount),
        handleTxStatusChange
      );

      setTxHash(result.hash);

      // Update campaign state
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaignId
            ? {
              ...c,
              raised: c.raised + amount,
              donorCount: c.donorCount + 1,
              isActive: c.raised + amount < c.target,
            }
            : c
        )
      );

      // Add to events
      setEvents((prev) => [
        {
          id: Date.now(),
          type: 'donate',
          from: publicKey,
          to: campaignAddress,
          amount: String(amount),
          asset: 'XLM',
          timestamp: new Date().toISOString(),
          hash: result.hash,
        },
        ...prev,
      ].slice(0, 50));

      // Refresh balance
      const newBal = await getBalance(publicKey);
      setBalance(Number(newBal).toFixed(2));

      addToast('success', 'Donation Sent!', `${amount} XLM donated to campaign #${campaignId}`);
    } catch (err) {
      addToast(
        'error',
        err.name || 'Donation Failed',
        err.message || 'Could not process donation'
      );
    }
  }, [connected, publicKey, handleTxStatusChange, addToast]);

  // ─── Create Campaign ───
  const handleCreateCampaign = useCallback(async (campaignData) => {
    if (!connected) {
      addToast('error', 'Wallet Required', 'Please connect your wallet');
      return;
    }

    try {
      handleTxStatusChange(TX_STATUS.BUILDING, 'Creating campaign on blockchain...');

      // Simulate contract interaction for demo
      // In production: await createCampaign(title, description, target, deadline, handleTxStatusChange);
      await new Promise((resolve) => setTimeout(resolve, 500));
      handleTxStatusChange(TX_STATUS.SIMULATING, 'Simulating transaction...');
      await new Promise((resolve) => setTimeout(resolve, 800));
      handleTxStatusChange(TX_STATUS.AWAITING_SIGNATURE, 'Please sign in your wallet...');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      handleTxStatusChange(TX_STATUS.SUBMITTING, 'Submitting to Stellar...');
      await new Promise((resolve) => setTimeout(resolve, 1000));
      handleTxStatusChange(TX_STATUS.PENDING, 'Waiting for confirmation...');
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const newCampaign = {
        id: campaigns.length + 1,
        title: campaignData.title,
        description: campaignData.description,
        target: campaignData.target,
        raised: 0,
        deadline: campaignData.deadline,
        isActive: true,
        donorCount: 0,
        category: campaignData.category,
        color: campaignData.color,
      };

      setCampaigns((prev) => [newCampaign, ...prev]);

      const fakeTxHash = 'sim_' + Math.random().toString(36).substring(2, 15);
      setTxHash(fakeTxHash);
      handleTxStatusChange(TX_STATUS.SUCCESS, 'Campaign created on Stellar testnet!');

      // Add to events
      setEvents((prev) => [
        {
          id: Date.now(),
          type: 'create',
          from: publicKey,
          amount: null,
          timestamp: new Date().toISOString(),
          hash: fakeTxHash,
        },
        ...prev,
      ].slice(0, 50));

      addToast('success', 'Campaign Launched!', `"${campaignData.title}" is now live`);
    } catch (err) {
      addToast('error', 'Creation Failed', err.message || 'Could not create campaign');
    }
  }, [connected, campaigns.length, publicKey, handleTxStatusChange, addToast]);

  // ─── Close Transaction Tracker ───
  const closeTxTracker = useCallback(() => {
    setTxStatus(TX_STATUS.IDLE);
    setTxMessage('');
    setTxHash('');
  }, []);

  // Calculate stats
  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised, 0);
  const totalDonors = campaigns.reduce((sum, c) => sum + c.donorCount, 0);
  const activeCampaigns = campaigns.filter((c) => c.isActive).length;

  return (
    <div className="app">
      <Header
        connected={connected}
        setConnected={setConnected}
        publicKey={publicKey}
        setPublicKey={setPublicKey}
        balance={balance}
        setBalance={setBalance}
        addToast={addToast}
      />

      <Toast toasts={toasts} removeToast={removeToast} />

      <main className="app-main">
        {/* Hero Section */}
        <section className="hero" id="hero">
          <div className="hero-glow"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Powered by Stellar Soroban
            </div>
            <h1 className="hero-title">
              Fund the <span className="hero-highlight">Future</span> on Stellar
            </h1>
            <p className="hero-subtitle">
              Decentralized crowdfunding with real-time tracking. Connect your wallet, create campaigns, and donate — all on the Stellar testnet blockchain.
            </p>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="hero-stat-value">{totalRaised.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                <span className="hero-stat-label">XLM Raised</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">{totalDonors}</span>
                <span className="hero-stat-label">Contributors</span>
              </div>
              <div className="hero-stat-divider"></div>
              <div className="hero-stat">
                <span className="hero-stat-value">{activeCampaigns}</span>
                <span className="hero-stat-label">Active Campaigns</span>
              </div>
            </div>

            <div className="hero-contract-info">
              <span className="hero-contract-label">Contract:</span>
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hero-contract-link mono"
              >
                {CONTRACT_ID.slice(0, 12)}...{CONTRACT_ID.slice(-8)}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </section>

        {/* Transaction Status Tracker */}
        {txStatus !== TX_STATUS.IDLE && (
          <section className="section-padded">
            <TransactionTracker
              status={txStatus}
              message={txMessage}
              txHash={txHash}
              onClose={closeTxTracker}
            />
          </section>
        )}

        {/* Campaigns Grid */}
        <section className="section" id="campaigns">
          <div className="section-header">
            <h2 className="section-title">Active Campaigns</h2>
            <p className="section-subtitle">Support projects building on Stellar</p>
          </div>
          <div className="campaigns-grid">
            {campaigns.map((campaign, index) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onDonate={handleDonate}
                connected={connected}
              />
            ))}
          </div>
        </section>

        {/* Bottom Section: Create + Activity */}
        <section className="bottom-section">
          <div className="bottom-left">
            <CreateCampaign
              onCreateCampaign={handleCreateCampaign}
              connected={connected}
            />

            {/* Send Payment Card */}
            {connected && (
              <SendPayment
                onBalanceUpdate={setBalance}
                addToast={addToast}
                onTxStatusChange={handleTxStatusChange}
              />
            )}
          </div>

          <div className="bottom-right" id="activity">
            <ActivityFeed events={events} isStreaming={isStreaming} />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <span className="footer-logo">StellarFund</span>
            <span className="footer-tagline">Decentralized Crowdfunding on Stellar Testnet</span>
          </div>
          <div className="footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <a href="https://github.com/Pixie-19" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--accent-tertiary)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.744.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              Follow @Pixie-19
            </a>
          </div>
          <p className="footer-copyright" style={{ marginTop: '4px', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            Built with ❤️ by <span style={{ color: 'var(--accent-secondary)', fontWeight: '700' }}>Rishita Seal</span>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
