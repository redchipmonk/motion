import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from "./App";

// Mock the API to prevent network requests to localhost:8000 during tests
vi.mock('./lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]), // Return empty array or mock data
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  }
}))

const renderWithProviders = (ui: React.ReactElement) => {
  // Set up authenticated state before rendering
  localStorage.setItem('token', 'test-token');
  localStorage.setItem('user', JSON.stringify({ _id: '123', name: 'Test User', email: 'test@test.com' }));

  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      {ui}
    </GoogleOAuthProvider>
  );
};

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the upcoming events heading on the default route", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("heading", { name: /upcoming events/i })).toBeInTheDocument();
  });

  it("includes a sign-out button in the header", () => {
    renderWithProviders(<App />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
