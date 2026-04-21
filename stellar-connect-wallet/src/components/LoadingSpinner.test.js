import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  LoadingSpinner,
  ProgressBar,
  SkeletonLoader,
  StatusBadge,
  StepIndicator,
} from '../components/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('should render spinner by default', () => {
    const { container } = render(<LoadingSpinner />);
    expect(container.querySelector('.loading-spinner')).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container: smContainer } = render(<LoadingSpinner size="sm" />);
    expect(smContainer.querySelector('.loading-spinner-sm')).toBeInTheDocument();

    const { container: lgContainer } = render(<LoadingSpinner size="lg" />);
    expect(lgContainer.querySelector('.loading-spinner-lg')).toBeInTheDocument();
  });

  it('should render with different variants', () => {
    const { container: pulseContainer } = render(<LoadingSpinner variant="pulse" />);
    expect(pulseContainer.querySelector('.loading-spinner-pulse')).toBeInTheDocument();

    const { container: orbitContainer } = render(<LoadingSpinner variant="orbit" />);
    expect(orbitContainer.querySelector('.loading-spinner-orbit')).toBeInTheDocument();
  });

  it('should render with message', () => {
    render(<LoadingSpinner message="Loading data..." />);
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should apply custom color', () => {
    const { container } = render(<LoadingSpinner color="#ff0000" />);
    const spinner = container.querySelector('.loading-spinner');
    expect(spinner).toHaveStyle({ color: '#ff0000' });
  });
});

describe('ProgressBar Component', () => {
  it('should render progress bar', () => {
    const { container } = render(<ProgressBar percentage={50} />);
    expect(container.querySelector('.progress-bar-wrapper')).toBeInTheDocument();
  });

  it('should set correct progress width', () => {
    const { container } = render(<ProgressBar percentage={75} />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill).toHaveStyle({ width: '75%' });
  });

  it('should clamp percentage between 0-100', () => {
    const { container: lowContainer } = render(<ProgressBar percentage={-10} />);
    expect(lowContainer.querySelector('.progress-bar-fill')).toHaveStyle({ width: '0%' });

    const { container: highContainer } = render(<ProgressBar percentage={150} />);
    expect(highContainer.querySelector('.progress-bar-fill')).toHaveStyle({ width: '100%' });
  });

  it('should render with label', () => {
    render(<ProgressBar percentage={50} label="Funding Progress" />);
    expect(screen.getByText('Funding Progress')).toBeInTheDocument();
  });

  it('should show percentage text by default', () => {
    render(<ProgressBar percentage={50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('should hide percentage text when disabled', () => {
    render(<ProgressBar percentage={50} showPercentage={false} />);
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
  });

  it('should apply custom color', () => {
    const { container } = render(<ProgressBar percentage={50} color="#ff0000" />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill).toHaveStyle({ backgroundColor: '#ff0000' });
  });
});

describe('SkeletonLoader Component', () => {
  it('should render skeleton loaders', () => {
    const { container } = render(<SkeletonLoader count={3} />);
    const skeletons = container.querySelectorAll('.skeleton-item');
    expect(skeletons).toHaveLength(3);
  });

  it('should render single skeleton by default', () => {
    const { container } = render(<SkeletonLoader />);
    const skeletons = container.querySelectorAll('.skeleton-item');
    expect(skeletons).toHaveLength(1);
  });

  it('should render different skeleton types', () => {
    const { container: lineContainer } = render(<SkeletonLoader type="line" />);
    expect(lineContainer.querySelector('.skeleton-line')).toBeInTheDocument();

    const { container: cardContainer } = render(<SkeletonLoader type="card" />);
    expect(cardContainer.querySelector('.skeleton-card')).toBeInTheDocument();

    const { container: circleContainer } = render(<SkeletonLoader type="circle" />);
    expect(circleContainer.querySelector('.skeleton-circle')).toBeInTheDocument();
  });
});

describe('StatusBadge Component', () => {
  it('should render status badge', () => {
    const { container } = render(<StatusBadge status="pending" />);
    expect(container.querySelector('.status-badge')).toBeInTheDocument();
  });

  it('should display correct status icon and label', () => {
    render(<StatusBadge status="success" />);
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render with message', () => {
    render(<StatusBadge status="failed" message="Transaction failed" />);
    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
  });

  it('should handle all status types', () => {
    const statuses = [
      'idle',
      'building',
      'simulating',
      'awaiting_signature',
      'submitting',
      'pending',
      'success',
      'failed',
      'rejected',
    ];

    statuses.forEach((status) => {
      const { container, unmount } = render(<StatusBadge status={status} />);
      expect(container.querySelector('.status-badge')).toBeInTheDocument();
      unmount();
    });
  });

  it('should display default status for unknown type', () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText('Idle')).toBeInTheDocument();
  });
});

describe('StepIndicator Component', () => {
  const mockSteps = [
    { label: 'Step 1', description: 'First step' },
    { label: 'Step 2', description: 'Second step' },
    { label: 'Step 3', description: 'Third step' },
  ];

  it('should render all steps', () => {
    render(<StepIndicator steps={mockSteps} currentStep={0} />);
    mockSteps.forEach((step) => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it('should mark current step as active', () => {
    const { container } = render(<StepIndicator steps={mockSteps} currentStep={1} />);
    const activeStep = container.querySelector('.step-item.active');
    expect(activeStep).toBeInTheDocument();
  });

  it('should mark completed steps', () => {
    const { container } = render(<StepIndicator steps={mockSteps} currentStep={2} />);
    const completedSteps = container.querySelectorAll('.step-item.completed');
    expect(completedSteps).toHaveLength(2);
  });

  it('should display step descriptions', () => {
    render(<StepIndicator steps={mockSteps} currentStep={0} />);
    mockSteps.forEach((step) => {
      expect(screen.getByText(step.description)).toBeInTheDocument();
    });
  });

  it('should render step status when provided', () => {
    const stepsWithStatus = [
      { label: 'Step 1', status: 'success' },
      { label: 'Step 2', status: 'pending' },
    ];

    render(<StepIndicator steps={stepsWithStatus} currentStep={1} />);
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should default to step 0 if currentStep not provided', () => {
    const { container } = render(<StepIndicator steps={mockSteps} />);
    const activeSteps = container.querySelectorAll('.step-item.active');
    expect(activeSteps).toHaveLength(1);
  });
});
