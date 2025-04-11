import React from 'react';
import { render } from '@testing-library/react';
import ChatPage from '../UI Components/chatPage';

describe('ChatPage', () => {
  it('renders without crashing', () => {
    render(<ChatPage drawerOpen={false} setDrawerOpen={() => {}} />);
  });
});
