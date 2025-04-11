import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../UI Components/login';

describe('Login Page', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('disables login if fields are empty', () => {
    render(<Login />);
    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);
    // Assuming alert is used for error
    expect(window.alert).toHaveBeenCalled();
  });
});
