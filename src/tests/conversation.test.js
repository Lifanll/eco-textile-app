import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Conversation from '../UI Components/conversation';
import { MemoryRouter } from 'react-router-dom';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
window.HTMLElement.prototype.scrollIntoView = function () {};
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});


describe('Conversation component', () => {
  it('renders input field', () => {
    render(<MemoryRouter><Conversation conversationID={1} /></MemoryRouter>);
    const input = screen.getByPlaceholderText(/type your message/i);
    expect(input).toBeInTheDocument();
  });

  it('does not allow empty message/image submission', () => {
    render(<MemoryRouter><Conversation conversationID={1} /></MemoryRouter>);
    const sendButton = screen.getByRole('button', { name: /➤/i });
    fireEvent.click(sendButton);
    expect(window.alert).toHaveBeenCalled(); // requires jest.spyOn for window.alert
  });

  // ...add more tests to check fake typing, scroll to bottom, etc.
});
