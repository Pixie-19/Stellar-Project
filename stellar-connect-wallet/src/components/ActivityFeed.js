import React from 'react';
import './ActivityFeed.css';

const ActivityFeed = ({ events, isStreaming }) => {
  const getEventIcon = (type) => {
    switch (type) {
      case 'payment':
      case 'donate':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M2 12h20" strokeLinecap="round" />
          </svg>
        );
      case 'create_account':
      case 'create':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6M23 11h-6" strokeLinecap="round" />
          </svg>
        );
      case 'contract':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
        );
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'payment':
      case 'donate': return '#7c3aed';
      case 'create_account':
      case 'create': return '#10b981';
      case 'contract': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="activity-feed" id="activity-feed">
      <div className="activity-feed-header">
        <div className="activity-feed-title-row">
          <h3 className="activity-feed-title">Live Activity</h3>
          {isStreaming && (
            <div className="activity-live-badge">
              <div className="activity-live-dot"></div>
              <span>LIVE</span>
            </div>
          )}
        </div>
        <p className="activity-feed-subtitle">Real-time blockchain events</p>
      </div>

      <div className="activity-feed-list">
        {events.length === 0 ? (
          <div className="activity-empty">
            <div className="activity-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="activity-empty-text">No events yet</p>
            <p className="activity-empty-subtext">
              Events will appear here as transactions occur
            </p>
          </div>
        ) : (
          events.map((event, index) => (
            <div
              key={event.id || index}
              className="activity-item"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="activity-item-icon" style={{ color: getEventColor(event.type), borderColor: getEventColor(event.type) }}>
                {getEventIcon(event.type)}
              </div>

              <div className="activity-item-content">
                <div className="activity-item-main">
                  <span className="activity-item-type">
                    {event.type === 'payment' ? 'Payment' :
                     event.type === 'donate' ? 'Donation' :
                     event.type === 'create_account' ? 'Account Created' :
                     event.type === 'create' ? 'Campaign Created' :
                     event.type === 'contract' ? 'Contract Call' :
                     event.type}
                  </span>
                  {event.amount && (
                    <span className="activity-item-amount">
                      {Number(event.amount).toFixed(2)} {event.asset || 'XLM'}
                    </span>
                  )}
                </div>

                <div className="activity-item-details">
                  {event.from && (
                    <span className="activity-item-address mono" title={event.from}>
                      {event.from.slice(0, 6)}...{event.from.slice(-4)}
                    </span>
                  )}
                  {event.from && event.to && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="activity-arrow">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                  {event.to && (
                    <span className="activity-item-address mono" title={event.to}>
                      {event.to.slice(0, 6)}...{event.to.slice(-4)}
                    </span>
                  )}
                </div>
              </div>

              <div className="activity-item-meta">
                <span className="activity-item-time">{formatTime(event.timestamp)}</span>
                {event.hash && (
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${event.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="activity-item-link"
                    title="View on explorer"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;
