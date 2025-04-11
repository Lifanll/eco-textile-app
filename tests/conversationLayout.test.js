import React from 'react';
import { render, screen } from '@testing-library/react';
import ConversationLayout from '../UI Components/conversationLayout';

describe('ConversationLayout', () => {
  it('renders sidebar title', () => {
    render(
      <ConversationLayout
        activeConversationId={null}
        onSelectConversation={() => {}}
        drawerOpen={false}
        setDrawerOpen={() => {}}
      >
        <div>Chat Content</div>
      </ConversationLayout>
    );
    expect(screen.getByText(/my conversations/i)).toBeInTheDocument();
  });
});
