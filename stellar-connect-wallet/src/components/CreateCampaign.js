import React, { useState } from 'react';
import './CreateCampaign.css';

const CreateCampaign = ({ onCreateCampaign, connected }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [duration, setDuration] = useState('30');
  const [category, setCategory] = useState('General');

  const categories = [
    { name: 'General', color: '#7c3aed' },
    { name: 'Education', color: '#3b82f6' },
    { name: 'Healthcare', color: '#10b981' },
    { name: 'Technology', color: '#f59e0b' },
    { name: 'Community', color: '#ec4899' },
    { name: 'Environment', color: '#14b8a6' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description || !targetAmount || Number(targetAmount) <= 0) return;

    const deadline = Date.now() + Number(duration) * 24 * 60 * 60 * 1000;
    const selectedCategory = categories.find(c => c.name === category);

    onCreateCampaign({
      title,
      description,
      target: Number(targetAmount),
      deadline,
      category: category,
      color: selectedCategory?.color || '#7c3aed',
    });

    setTitle('');
    setDescription('');
    setTargetAmount('');
    setDuration('30');
  };

  return (
    <div className="create-campaign" id="create">
      <div className="create-campaign-header">
        <div className="create-campaign-title-row">
          <div className="create-icon-wrapper">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M2 12h20" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h2 className="create-campaign-title">Launch a Campaign</h2>
            <p className="create-campaign-subtitle">Create a crowdfunding campaign on the Stellar blockchain</p>
          </div>
        </div>
      </div>

      <form className="create-campaign-form" onSubmit={handleSubmit}>
        <div className="create-field">
          <label className="create-label" htmlFor="campaign-title">
            Campaign Title
            <span className="create-label-hint">{title.length}/80</span>
          </label>
          <input
            id="campaign-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            placeholder="e.g., Build a Community Library"
            className="create-input"
            required
          />
        </div>

        <div className="create-field">
          <label className="create-label" htmlFor="campaign-description">
            Description
            <span className="create-label-hint">{description.length}/500</span>
          </label>
          <textarea
            id="campaign-description"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Explain your campaign goal, how funds will be used..."
            className="create-textarea"
            rows={4}
            required
          />
        </div>

        <div className="create-row">
          <div className="create-field">
            <label className="create-label" htmlFor="campaign-target">Funding Goal (XLM)</label>
            <div className="create-input-wrapper">
              <input
                id="campaign-target"
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="1000"
                min="1"
                step="any"
                className="create-input create-input-amount"
                required
              />
              <span className="create-input-suffix">XLM</span>
            </div>
          </div>

          <div className="create-field">
            <label className="create-label" htmlFor="campaign-duration">Duration</label>
            <select
              id="campaign-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="create-select"
            >
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>

        <div className="create-field">
          <label className="create-label">Category</label>
          <div className="create-categories">
            {categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                className={`create-category-btn ${category === cat.name ? 'create-category-active' : ''}`}
                onClick={() => setCategory(cat.name)}
                style={{
                  '--cat-color': cat.color,
                  borderColor: category === cat.name ? cat.color : undefined,
                  background: category === cat.name ? `${cat.color}15` : undefined,
                }}
              >
                <span className="create-category-dot" style={{ background: cat.color }}></span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg create-submit-btn"
          disabled={!connected || !title || !description || !targetAmount}
        >
          {!connected ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Connect Wallet to Create
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.58-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Launch Campaign on Testnet
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateCampaign;
