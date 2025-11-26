import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

describe("App", () => {
  it("renders the not logged in heading by default", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /not logged in/i })).toBeInTheDocument();
  });
});