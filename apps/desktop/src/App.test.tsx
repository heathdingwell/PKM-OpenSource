import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the notebook view shell", () => {
    render(<App />);
    expect(screen.getByRole("application", { name: "Evernote OpenSource Shell" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Note" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily Notes" })).toBeInTheDocument();
  });
});
