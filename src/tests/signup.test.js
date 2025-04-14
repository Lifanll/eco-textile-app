import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../UI Components/signup';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});


describe('SignUp', () => {
  it('renders signup fields and buttons', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBe(2);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows alert if password and confirm do not match', () => {
    render(
      <MemoryRouter>
        <SignUp />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    const passwordFields = screen.getAllByLabelText(/password/i);
    fireEvent.change(passwordFields[0], { target: { value: 'abc123' } });
    fireEvent.change(passwordFields[1], { target: { value: 'wrong' } });

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    expect(window.alert).toHaveBeenCalledWith('Passwords do not match!');
  });
});
