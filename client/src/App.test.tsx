import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./App";

describe("App", () => {
  it("renders the default heading", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: /vite \+ react/i })).toBeInTheDocument();
  });
});
