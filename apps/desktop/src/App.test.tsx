import { fireEvent, render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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
    expect(screen.getByRole("heading", { name: "Saved searches", level: 2 })).toBeInTheDocument();
  });

  it("opens command palette from quick actions button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByRole("heading", { name: "Command palette", level: 4 })).toBeInTheDocument();
  });

  it("opens template picker from sidebar action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "New from template" }));
    expect(screen.getByRole("heading", { name: "New from template", level: 3 })).toBeInTheDocument();
  });

  it("creates a note from template picker", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "New from template" }));
    fireEvent.change(screen.getByPlaceholderText("New note title"), { target: { value: "Template Result Note" } });
    fireEvent.click(screen.getByRole("button", { name: "Create note" }));

    expect(await screen.findByRole("heading", { name: "Template Result Note", level: 2 })).toBeInTheDocument();
  });

  it("opens tasks panel from create task button", () => {
    render(<App />);
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("Quick task");
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    promptSpy.mockRestore();
  });

  it("toggles backlinks dock in notes view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    expect(screen.getByRole("heading", { name: "Backlinks", level: 2 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Backlinks" }));
    expect(screen.queryByRole("heading", { name: "Backlinks", level: 2 })).not.toBeInTheDocument();
  });

  it("opens a note in lite edit mode from context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open in Lite edit mode/i }));

    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("supports arrow navigation and enter for focused editor mode", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByRole("heading", { name: "To-do list", level: 2 })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("moves the active note to trash with cmd+backspace", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByRole("heading", { name: "Trash", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("moves a note to trash and restores it from trash view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Move to Trash/i }));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByRole("heading", { name: "Trash", level: 1 })).toBeInTheDocument();

    const trashedCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(trashedCard).toBeTruthy();
    fireEvent.contextMenu(trashedCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Restore from Trash/i }));

    expect(screen.getByText("Trash is empty.")).toBeInTheDocument();
  });

  it("empties trash from trash header action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Move to Trash/i }));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Empty Trash" }));
    confirmSpy.mockRestore();

    expect(screen.getByText("Trash is empty.")).toBeInTheDocument();
  });
});
