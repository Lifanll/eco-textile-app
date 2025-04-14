import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignUp from '../UI Components/signup';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});


describe('SignUp', () => {
  it('renders signup form fields', () => {
    render(<MemoryRouter><SignUp /></MemoryRouter>);
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    
    // Use getAllByLabelText since both "Password" and "Confirm Password" match /password/i
    const passwordFields = screen.getAllByLabelText(/password/i);
    expect(passwordFields.length).toBe(2);
  });  
});
