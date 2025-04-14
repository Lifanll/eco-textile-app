import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from '../UI Components/chatPage';

jest.mock('remark-gfm', () => () => {});
jest.mock('react-markdown', () => 'ReactMarkdown');
window.HTMLElement.prototype.scrollIntoView = function () {};
beforeEach(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});


describe('ChatPage', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><ChatPage drawerOpen={false} setDrawerOpen={() => {}} /></MemoryRouter>);
  });
});
