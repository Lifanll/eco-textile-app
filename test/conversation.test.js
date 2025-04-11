import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Conversation from "../conversation";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { rest } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  rest.post("https://eco-textile-app-backend.onrender.com/getMessages", (req, res, ctx) => {
    return res(ctx.json({ messages: [{ isUser: true, message: "Hi!" }] }));
  }),
  rest.post("https://eco-textile-app-backend.onrender.com/ask", (req, res, ctx) => {
    return res(ctx.json({ response: "Hello from backend!" }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Conversation Page", () => {
  test("displays messages from backend and allows sending", async () => {
    render(
      <MemoryRouter initialEntries={["/conversation/1"]}>
        <Routes>
          <Route path="/conversation/:conversationId" element={<Conversation />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for messages to load
    expect(await screen.findByText("Hi!")).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.change(input, { target: { value: "Hello backend!" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Hello from backend!")).toBeInTheDocument();
    });
  });
});
