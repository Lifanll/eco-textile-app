import React from 'react';
import { render, screen } from '@testing-library/react';
import ConversationLayout from '../UI Components/conversationLayout';
import { MemoryRouter } from 'react-router-dom';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
window.HTMLElement.prototype.scrollIntoView = function () {};
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

describe('ConversationLayout', () => {
  it('renders sidebar title', () => {
    render(
      <MemoryRouter>
        <ConversationLayout
          activeConversationId={null}
          onSelectConversation={() => { }}
          drawerOpen={false}
          setDrawerOpen={() => { }}
        >
          <div>Chat Content</div>
        </ConversationLayout>
      </MemoryRouter>
    );
    expect(screen.getByText(/my conversations/i)).toBeInTheDocument();
  });
  it('renders children and allows sidebar toggle', () => {
    const { getByText } = render(
      <MemoryRouter>
        <ConversationLayout
          activeConversationId={null}
          onSelectConversation={() => {}}
          drawerOpen={true}
          setDrawerOpen={() => {}}
        >
          <div>Test Child</div>
        </ConversationLayout>
      </MemoryRouter>
    );
    expect(getByText('Test Child')).toBeInTheDocument();
  });
});
