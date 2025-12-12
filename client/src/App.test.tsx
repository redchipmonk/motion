import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

describe("App", () => {
  it("renders the upcoming events heading on the default route", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /upcoming events/i })).toBeInTheDocument();
  });

  it("includes a sign-out button in the header", () => {
    render(<App />);
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
