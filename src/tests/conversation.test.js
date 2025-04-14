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
  const mockConversationID = '12345';
  it('renders message input and send button', () => {
    render(<MemoryRouter><Conversation conversationID={mockConversationID} /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /➤/i })).toBeInTheDocument();
  });


  it('does not allow empty message/image submission', () => {
    render(<MemoryRouter><Conversation conversationID={mockConversationID} /></MemoryRouter>);
    const sendButton = screen.getByRole('button', { name: /➤/i });
    fireEvent.click(sendButton);
    expect(window.alert).toHaveBeenCalled(); // requires jest.spyOn for window.alert
  });

  it('allows typing and sends message on button click', () => {
    render(<MemoryRouter><Conversation conversationID={mockConversationID} /></MemoryRouter>);
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input.value).toBe('Hello');
    fireEvent.click(screen.getByRole('button', { name: /➤/i }));
    expect(input.value).toBe('');
  });
});
