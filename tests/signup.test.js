import React from 'react';
import { render, screen } from '@testing-library/react';
import SignUp from '../UI Components/signup';

describe('SignUp', () => {
  it('renders signup form fields', () => {
    render(<SignUp />);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });
});
