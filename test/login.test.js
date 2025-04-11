import { render, screen, fireEvent } from "@testing-library/react";
import Login from "../login";
import { MemoryRouter } from "react-router-dom";

describe("Login Component", () => {
  test("renders inputs and button", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  });

  test("displays error for empty fields", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /login/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
