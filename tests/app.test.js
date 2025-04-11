import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';
import { MemoryRouter } from 'react-router-dom';

// Mock JWT token for authentication check
const mockToken = {
  exp: Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour from now
};

jest.mock('jwt-decode', () => () => mockToken);

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders EcoTextBot title in AppBar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/EcoTextBot/i)).toBeInTheDocument();
  });

  it('shows Login form on / route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
  });

  it('shows SignUp form on /signup route', () => {
    render(
      <MemoryRouter initialEntries={['/signup']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('shows Logout button when authenticated', () => {
    localStorage.setItem('access_token', 'fake-token');
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );
    expect(screen.getByText(/logout/i)).toBeInTheDocument();
  });
});
