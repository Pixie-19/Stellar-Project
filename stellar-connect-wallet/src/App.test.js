import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app header brand', () => {
  render(<App />);
  const brandElements = screen.getAllByText(/StellarFund/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
