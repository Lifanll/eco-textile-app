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
  it('renders login fields and buttons', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows alert when fields are empty on submit', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(window.alert).toHaveBeenCalled();
  });
});
