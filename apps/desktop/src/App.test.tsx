import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    (window as unknown as { pkmShell?: unknown }).pkmShell = undefined;
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

  it("saves scratch pad content to a note via modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.change(screen.getByPlaceholderText("Capture quick thoughts, todos, or links..."), {
      target: { value: "Scratch title\nMore detail" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save to note" }));
    expect(screen.getByRole("heading", { name: "Save scratch to note", level: 3 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Create note" }));
    expect(screen.getByRole("heading", { name: "Scratch title", level: 2 })).toBeInTheDocument();
  });

  it("opens command palette from quick actions button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByRole("heading", { name: "Command palette", level: 4 })).toBeInTheDocument();
  });

  it("creates and edits a saved search via modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "tag:meetings" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));

    expect(screen.getByRole("heading", { name: "Save search", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Meetings focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Edit saved search Meetings focus" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Edit saved search Meetings focus" }));
    expect(screen.getByRole("heading", { name: "Edit saved search", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Meeting filter" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(screen.queryByRole("button", { name: "Edit saved search Meetings focus" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit saved search Meeting filter" })).toBeInTheDocument();
  });


  it("inserts a markdown linked note from typed slash menu via modal", () => {
    const promptSpy = vi.spyOn(window, "prompt");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const slashCommand = `${editor?.value ?? ""}
/link`;
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: slashCommand, selectionStart: slashCommand.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("button", { name: "Link to note" }));

    expect(screen.getByRole("heading", { name: "Link to note", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Roadmap Hub" } });
    fireEvent.click(screen.getByRole("button", { name: "Insert link" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("[[Roadmap Hub]]");
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("opens template picker from sidebar action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "New from template" }));
    expect(screen.getByRole("heading", { name: "New from template", level: 3 })).toBeInTheDocument();
  });

  it("creates a notebook from modal flow", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ New notebook" }));
    expect(screen.getByRole("heading", { name: "New notebook", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Notebook name"), { target: { value: "Research" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("heading", { name: "Research", level: 1 })).toBeInTheDocument();
  });

  it("opens template picker from note header action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "From template" }));
    expect(screen.getByRole("heading", { name: "New from template", level: 3 })).toBeInTheDocument();
  });

  it("creates a note from template picker", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "New from template" }));
    fireEvent.change(screen.getByPlaceholderText("New note title"), { target: { value: "Template Result Note" } });
    fireEvent.click(screen.getByRole("button", { name: "Create note" }));

    expect(await screen.findByRole("heading", { name: "Template Result Note", level: 2 })).toBeInTheDocument();
  });

  it("creates a task from the task dialog", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByRole("heading", { name: "New task", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Quick task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Quick task")).toBeInTheDocument();
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

  it("shows bulk actions for multi-select and can trash selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    expect(screen.getByRole("toolbar", { name: "Bulk note actions" })).toBeInTheDocument();
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Move to Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Trash" }));

    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
  });

  it("toggles shortcuts from bulk actions", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Add Shortcuts" }));
    expect(screen.getByRole("button", { name: "Remove Shortcuts" })).toBeInTheDocument();
  });

  it("moves the active note to trash with cmd+backspace", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByRole("heading", { name: "Trash", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("restores a trashed note with cmd+z undo", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    fireEvent.keyDown(window, { key: "z", metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByText("Trash is empty.")).toBeInTheDocument();
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

  it("inserts a reciprocal wikilink when auto reciprocal links is enabled", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), { target: { value: ">auto reciprocal" } });
    fireEvent.click(screen.getByText("Toggle auto reciprocal links"));

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[[Daily Journal]]" }
    });

    const sourceOutgoingSection = screen.getByRole("heading", { name: "Outgoing links", level: 5 }).closest("section");
    expect(sourceOutgoingSection).toBeTruthy();
    fireEvent.click(within(sourceOutgoingSection as HTMLElement).getByRole("button", { name: "Daily Journal" }));

    expect(screen.getByRole("heading", { name: "Daily Journal", level: 2 })).toBeInTheDocument();
    const targetOutgoingSection = screen.getByRole("heading", { name: "Outgoing links", level: 5 }).closest("section");
    expect(targetOutgoingSection).toBeTruthy();
    expect(within(targetOutgoingSection as HTMLElement).getByRole("button", { name: "Agenda" })).toBeInTheDocument();
  });

  it("toggles auto reciprocal links from the editor header", () => {
    render(<App />);
    const autoLinksButton = screen.getByRole("button", { name: "Auto links" });
    expect(autoLinksButton).not.toHaveClass("active");

    fireEvent.click(autoLinksButton);
    expect(autoLinksButton).toHaveClass("active");
  });

  it("inserts AI response content into the active note", async () => {
    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "- Suggested action\n- Follow-up item"
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "Plan my next steps" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Suggested action/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Insert into note" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("- Suggested action");
    expect(editor?.value).toContain("- Follow-up item");
  });

});
