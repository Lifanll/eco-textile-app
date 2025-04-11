import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Conversation from '../UI Components/conversation';

describe('Conversation component', () => {
  it('renders input field', () => {
    render(<Conversation conversationID={1} />);
    const input = screen.getByPlaceholderText(/type your message/i);
    expect(input).toBeInTheDocument();
  });

  it('does not allow empty message/image submission', () => {
    render(<Conversation conversationID={1} />);
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    expect(window.alert).toHaveBeenCalled(); // requires jest.spyOn for window.alert
  });

  // ...add more tests to check fake typing, scroll to bottom, etc.
});
