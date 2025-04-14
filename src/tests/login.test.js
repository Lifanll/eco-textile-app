import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../UI Components/login';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('Login Page', () => {
  it('renders login form', () => {
    render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
    );
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('disables login if fields are empty', () => {
    render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>
    );
    const loginButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginButton);
    // Assuming alert is used for error
    expect(window.alert).toHaveBeenCalled();
  });
});
