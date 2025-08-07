import { render, screen } from '@testing-library/react';
import DashboardPage from '../pages/dashboard/DashboardPage';

// Simple test to verify basic setup
describe('Simple Setup Test', () => {
  it('should render a basic component', () => {
    render(<DashboardPage />);
    const element = screen.getByText('儀表板');
    expect(element).toBeTruthy();
    expect(element.textContent).toBe('儀表板');
  });
});