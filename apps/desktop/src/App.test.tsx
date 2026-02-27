import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders the notebook view shell", () => {
    render(<App />);
    expect(screen.getByRole("application", { name: "PKM OpenSource Shell" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "+ Note" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Daily Notes" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("separator", { name: "Resize note list" })).toBeInTheDocument();
  });

  it("opens shortcuts browse mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByRole("heading", { name: "Shortcuts", level: 1 })).toBeInTheDocument();
  });

  it("opens home dashboard mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();
  });

  it("opens command palette from quick actions button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByRole("heading", { name: "Command palette", level: 4 })).toBeInTheDocument();
  });

  it("opens tasks panel from create task button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
  });
});
