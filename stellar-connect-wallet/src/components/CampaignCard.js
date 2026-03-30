import React, { useState } from 'react';
import './CampaignCard.css';

const CampaignCard = ({ campaign, onDonate, connected }) => {
  const [donateAmount, setDonateAmount] = useState('');
  const [showDonateForm, setShowDonateForm] = useState(false);

  const progress = Math.min((campaign.raised / campaign.target) * 100, 100);
  const isComplete = progress >= 100;
  const daysLeft = Math.max(0, Math.ceil((campaign.deadline - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleDonate = () => {
    if (!donateAmount || Number(donateAmount) <= 0) return;
    onDonate(campaign.id, Number(donateAmount));
    setDonateAmount('');
    setShowDonateForm(false);
  };

  const formatAmount = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
    return amount.toFixed(2);
  };

  return (
    <div className={`campaign-card ${isComplete ? 'campaign-card-complete' : ''}`} id={`campaign-${campaign.id}`}>
      <div className="campaign-card-header">
        <div className="campaign-card-category">
          <span className="campaign-category-dot" style={{ background: campaign.color || '#7c3aed' }}></span>
          <span className="campaign-category-text">{campaign.category || 'General'}</span>
        </div>
        <div className={`campaign-status ${isComplete ? 'campaign-status-complete' : campaign.isActive ? 'campaign-status-active' : 'campaign-status-closed'}`}>
          {isComplete ? '✓ Funded' : campaign.isActive ? 'Active' : 'Closed'}
        </div>
      </div>

      <div className="campaign-card-body">
        <h3 className="campaign-title">{campaign.title}</h3>
        <p className="campaign-description">{campaign.description}</p>

        <div className="campaign-progress-section">
          <div className="campaign-progress-bar-wrapper">
            <div className="campaign-progress-bar">
              <div
                className="campaign-progress-fill"
                style={{
                  width: `${progress}%`,
                  background: isComplete
                    ? 'linear-gradient(90deg, #10b981, #34d399)'
                    : 'var(--gradient-primary)',
                }}
              >
                {progress > 15 && (
                  <div className="campaign-progress-shimmer"></div>
                )}
              </div>
            </div>
            <span className="campaign-progress-percent">{progress.toFixed(1)}%</span>
          </div>

          <div className="campaign-amounts">
            <div className="campaign-amount-raised">
              <span className="campaign-amount-value">{formatAmount(campaign.raised)}</span>
              <span className="campaign-amount-label">XLM raised</span>
            </div>
            <div className="campaign-amount-target">
              <span className="campaign-amount-value">{formatAmount(campaign.target)}</span>
              <span className="campaign-amount-label">XLM goal</span>
            </div>
          </div>
        </div>

        <div className="campaign-meta">
          <div className="campaign-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{campaign.donorCount} donor{campaign.donorCount !== 1 ? 's' : ''}</span>
          </div>
          <div className="campaign-meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
          </div>
          <div className="campaign-meta-item mono" title="Contract Campaign ID">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
            </svg>
            <span>#{campaign.id}</span>
          </div>
        </div>
      </div>

      <div className="campaign-card-footer">
        {!showDonateForm ? (
          <button
            className="campaign-donate-btn"
            onClick={() => setShowDonateForm(true)}
            disabled={!connected || isComplete || !campaign.isActive}
          >
            {!connected ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12" strokeLinecap="round" />
                </svg>
                Connect Wallet
              </>
            ) : isComplete ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Fully Funded
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" strokeLinecap="round" />
                </svg>
                Donate XLM
              </>
            )}
          </button>
        ) : (
          <div className="campaign-donate-form">
            <div className="campaign-donate-input-wrapper">
              <input
                type="number"
                value={donateAmount}
                onChange={(e) => setDonateAmount(e.target.value)}
                placeholder="0.00"
                min="0"
                step="any"
                className="campaign-donate-input"
                autoFocus
              />
              <span className="campaign-donate-suffix">XLM</span>
            </div>
            <div className="campaign-donate-actions">
              <button className="campaign-donate-confirm" onClick={handleDonate} disabled={!donateAmount || Number(donateAmount) <= 0}>
                Send
              </button>
              <button className="campaign-donate-cancel" onClick={() => setShowDonateForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decorative glow */}
      <div className="campaign-card-glow" style={{ background: campaign.color || '#7c3aed' }}></div>
    </div>
  );
};

export default CampaignCard;
