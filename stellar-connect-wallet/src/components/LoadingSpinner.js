import React from 'react';
import './LoadingSpinner.css';

/**
 * Reusable loading spinner component with multiple variants
 * @param {string} size - 'sm' | 'md' | 'lg' (default: 'md')
 * @param {string} variant - 'default' | 'pulse' | 'orbit' (default: 'default')
 * @param {string} message - Optional loading message
 * @param {string} color - Custom color (default: 'inherit')
 */
export const LoadingSpinner = ({
  size = 'md',
  variant = 'default',
  message = null,
  color = 'inherit',
}) => {
  return (
    <div className={`loading-spinner loading-spinner-${size} loading-spinner-${variant}`} style={{ color }}>
      <div className="spinner-inner" />
      {message && <p className="spinner-message">{message}</p>}
    </div>
  );
};

/**
 * Progress bar component with percentage display
 * @param {number} percentage - Progress percentage (0-100)
 * @param {string} label - Optional label text
 * @param {boolean} showPercentage - Show percentage text (default: true)
 * @param {string} color - Custom color
 */
export const ProgressBar = ({
  percentage = 0,
  label = null,
  showPercentage = true,
  color = '#3b82f6',
}) => {
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="progress-bar-container">
      {label && <p className="progress-label">{label}</p>}
      <div className="progress-bar-wrapper">
        <div
          className="progress-bar-fill"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showPercentage && (
        <p className="progress-percentage">{Math.round(clampedPercentage)}%</p>
      )}
    </div>
  );
};

/**
 * Skeleton loader for content placeholders
 * @param {number} count - Number of skeleton items (default: 1)
 * @param {string} type - 'line' | 'card' | 'circle' (default: 'line')
 */
export const SkeletonLoader = ({ count = 1, type = 'line' }) => {
  const skeletons = Array(count).fill(null);

  return (
    <div className="skeleton-loader">
      {skeletons.map((_, i) => (
        <div key={i} className={`skeleton-item skeleton-${type}`} />
      ))}
    </div>
  );
};

/**
 * Status badge showing transaction or operation status
 * @param {string} status - Status type
 * @param {string} message - Optional message text
 */
export const StatusBadge = ({ status, message = null }) => {
  const statusConfig = {
    idle: { icon: '⭕', label: 'Idle', color: '#94a3b8' },
    building: { icon: '🔨', label: 'Building', color: '#f59e0b' },
    simulating: { icon: '⚙️', label: 'Simulating', color: '#f59e0b' },
    awaiting_signature: { icon: '✍️', label: 'Awaiting Signature', color: '#8b5cf6' },
    submitting: { icon: '📤', label: 'Submitting', color: '#f59e0b' },
    pending: { icon: '⏳', label: 'Pending', color: '#f59e0b' },
    success: { icon: '✅', label: 'Success', color: '#10b981' },
    failed: { icon: '❌', label: 'Failed', color: '#ef4444' },
    rejected: { icon: '🚫', label: 'Rejected', color: '#ef4444' },
  };

  const config = statusConfig[status] || statusConfig.idle;

  return (
    <div className="status-badge" style={{ borderColor: config.color }}>
      <span className="status-icon">{config.icon}</span>
      <div className="status-content">
        <p className="status-label">{config.label}</p>
        {message && <p className="status-message">{message}</p>}
      </div>
    </div>
  );
};

/**
 * Multi-step progress indicator
 * @param {Array} steps - Array of step objects { label, status }
 * @param {number} currentStep - Current active step (0-indexed)
 */
export const StepIndicator = ({ steps, currentStep = 0 }) => {
  return (
    <div className="step-indicator">
      {steps.map((step, idx) => {
        const isActive = idx === currentStep;
        const isCompleted = idx < currentStep;
        const stepStatus = step.status || 'pending';

        return (
          <div
            key={idx}
            className={`step-item ${isActive ? 'active' : ''} ${
              isCompleted ? 'completed' : ''
            }`}
          >
            <div className="step-dot">
              {isCompleted ? '✓' : idx + 1}
            </div>
            <div className="step-line" style={{ opacity: idx < steps.length - 1 ? 1 : 0 }} />
            <div className="step-content">
              <p className="step-label">{step.label}</p>
              {step.description && (
                <p className="step-description">{step.description}</p>
              )}
              {stepStatus !== 'pending' && (
                <p className={`step-status status-${stepStatus}`}>
                  {stepStatus}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default LoadingSpinner;
