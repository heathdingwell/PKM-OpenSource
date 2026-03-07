import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

  it("exposes clear toolbar labels and pressed states", () => {
    render(<App />);

    expect(screen.getByRole("button", { name: "More note actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Italic" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Underline" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bullet list" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Insert code block" })).toBeInTheDocument();

    const markdownButton = screen.getByRole("button", { name: "Markdown" });
    const richButton = screen.getByRole("button", { name: "Rich" });
    const insertButton = screen.getByRole("button", { name: "Insert" });
    const moreActionsButton = screen.getByRole("button", { name: "More note actions" });
    const liteButton = screen.getByRole("button", { name: "Lite" });
    const focusButton = screen.getByRole("button", { name: "Focus" });
    const aiButton = screen.getByRole("button", { name: "AI" });
    const autoLinksButton = screen.getByRole("button", { name: "Auto links" });

    expect(markdownButton).toHaveAttribute("aria-pressed", "true");
    expect(richButton).toHaveAttribute("aria-pressed", "false");
    expect(insertButton).toHaveAttribute("aria-haspopup", "listbox");
    expect(insertButton).toHaveAttribute("aria-expanded", "false");
    expect(moreActionsButton).toHaveAttribute("aria-haspopup", "menu");
    expect(moreActionsButton).toHaveAttribute("aria-expanded", "false");
    expect(liteButton).toHaveAttribute("aria-pressed", "false");
    expect(focusButton).toHaveAttribute("aria-pressed", "false");
    expect(aiButton).toHaveAttribute("aria-pressed", "false");
    expect(autoLinksButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(richButton);
    expect(markdownButton).toHaveAttribute("aria-pressed", "false");
    expect(richButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(insertButton);
    expect(insertButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Insert block menu" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Transcribe media" })).toHaveAttribute("aria-selected", "true");

    fireEvent.click(moreActionsButton);
    expect(moreActionsButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Note actions" })).toBeInTheDocument();

    fireEvent.click(liteButton);
    expect(liteButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(focusButton);
    expect(focusButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(aiButton);
    expect(aiButton).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(autoLinksButton);
    expect(autoLinksButton).toHaveAttribute("aria-pressed", "true");
  });

  it("exposes explicit tag editor controls", () => {
    render(<App />);

    const addTagButton = screen.getByRole("button", { name: "Add tag" });
    expect(screen.getByRole("button", { name: "Open tag editor" })).toBeInTheDocument();
    expect(addTagButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(addTagButton);
    expect(addTagButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByPlaceholderText("new-tag")).toHaveAttribute("id", "tag-input");
  });

  it("exposes note list menu buttons with menu state", () => {
    render(<App />);

    const layoutButton = screen.getByRole("button", { name: "Cards" });
    const densityButton = screen.getByRole("button", { name: "Comfortable" });
    const groupButton = screen.getByRole("button", { name: "Group: Off" });
    const backlinksButton = screen.getByRole("button", { name: "Backlinks" });
    const sortButton = screen.getByRole("button", { name: "Sort" });
    const filterButton = screen.getByRole("button", { name: "Filter" });

    expect(layoutButton).toHaveAttribute("title", "Toggle note list layout");
    expect(densityButton).toHaveAttribute("title", "Toggle note density");
    expect(backlinksButton).toHaveAttribute("aria-pressed", "true");
    expect(groupButton).toHaveAttribute("aria-haspopup", "menu");
    expect(groupButton).toHaveAttribute("aria-expanded", "false");
    expect(sortButton).toHaveAttribute("aria-haspopup", "menu");
    expect(sortButton).toHaveAttribute("aria-expanded", "false");
    expect(filterButton).toHaveAttribute("aria-haspopup", "menu");
    expect(filterButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(sortButton);
    expect(sortButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Sort notes menu" })).toBeInTheDocument();

    fireEvent.click(groupButton);
    expect(groupButton).toHaveAttribute("aria-expanded", "true");
    expect(sortButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("menu", { name: "Group notes menu" })).toBeInTheDocument();

    fireEvent.click(filterButton);
    expect(filterButton).toHaveAttribute("aria-expanded", "true");
    expect(groupButton).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("menu", { name: "Filter notes menu" })).toBeInTheDocument();
  });

  it("opens shortcuts browse mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByRole("heading", { name: "Shortcuts", level: 1 })).toBeInTheDocument();
  });

  it("exposes grouped footer actions in search modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.getByRole("toolbar", { name: "Search result actions" })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open templates" }
    });
    expect(screen.getByRole("toolbar", { name: "Command palette actions" })).toBeInTheDocument();
  });

  it("opens reminders browse mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Reminders" }));
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();

    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getByText("Agenda")).toBeInTheDocument();
    expect(within(notesList).getByText("Upcoming 2099-01-01")).toBeInTheDocument();
  });

  it("shows reminder sidebar badge with overdue ratio", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    if (!screen.queryByLabelText("Reminder date")) {
      fireEvent.click(screen.getByRole("button", { name: "Info" }));
    }
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    const remindersButton = screen.getByRole("button", { name: "Reminders" });
    const badge = remindersButton.querySelector(".sidebar-link-badge");
    expect(badge).toBeTruthy();
    expect(badge?.textContent).toBe("1/2");
    expect(badge).toHaveClass("alert");
  });

  it("filters reminder buckets in reminders mode", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    if (!screen.queryByLabelText("Reminder date")) {
      fireEvent.click(screen.getByRole("button", { name: "Info" }));
    }
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Reminders" }));
    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getByText("Overdue 2000-01-01")).toBeInTheDocument();
    expect(within(notesList).getByText("Upcoming 2099-01-01")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Overdue" }));
    expect(within(notesList).getByText("Overdue 2000-01-01")).toBeInTheDocument();
    expect(within(notesList).queryByText("Upcoming 2099-01-01")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Upcoming" }));
    expect(within(notesList).getByText("Upcoming 2099-01-01")).toBeInTheDocument();
    expect(within(notesList).queryByText("Overdue 2000-01-01")).not.toBeInTheDocument();
  });

  it("persists reminder bucket filter preference", () => {
    const first = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    if (!screen.queryByLabelText("Reminder date")) {
      fireEvent.click(screen.getByRole("button", { name: "Info" }));
    }
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Reminders" }));
    fireEvent.click(screen.getByRole("button", { name: "Overdue" }));
    expect(screen.getByRole("button", { name: "Overdue" })).toHaveClass("active");
    first.unmount();

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Reminders" }));

    const overdueChip = screen.getByRole("button", { name: "Overdue" });
    expect(overdueChip).toHaveClass("active");
    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getByText("Overdue 2000-01-01")).toBeInTheDocument();
    expect(within(notesList).queryByText("Upcoming 2099-01-01")).not.toBeInTheDocument();
  });

  it("opens home dashboard mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Saved searches", level: 2 })).toBeInTheDocument();
  });

  it("shows compact tag chips on note cards", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n#project #planning #review" }
    });
    fireEvent.keyDown(window, { key: "s", metaKey: true });

    const notesList = screen.getByLabelText("Notes list");
    const agendaCard = Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
      entry.textContent?.includes("Agenda")
    );
    expect(agendaCard).toBeTruthy();

    await waitFor(() => {
      expect(within(agendaCard as HTMLButtonElement).getByText("#planning")).toBeInTheDocument();
      expect(within(agendaCard as HTMLButtonElement).getByText("#project")).toBeInTheDocument();
      expect(within(agendaCard as HTMLButtonElement).getByText("+1")).toBeInTheDocument();
    });
  });

  it("opens graph mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Graph view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
  });

  it("clears recent notes from the sidebar section", () => {
    render(<App />);
    const notesList = screen.getByLabelText("Notes list");
    const card = Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
      entry.textContent?.includes("To-do list")
    );
    expect(card).toBeTruthy();
    fireEvent.click(card as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("No recent notes yet")).toBeInTheDocument();
  });

  it("removes a single recent note from the sidebar section", () => {
    render(<App />);
    const notesList = screen.getByLabelText("Notes list");
    const card = Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
      entry.textContent?.includes("To-do list")
    );
    expect(card).toBeTruthy();
    fireEvent.click(card as HTMLButtonElement);

    const removeButton = screen.getByRole("button", { name: "Remove recent note To-do list" });
    fireEvent.click(removeButton);

    expect(screen.queryByRole("button", { name: "Remove recent note To-do list" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed recent note "To-do list"')).toBeInTheDocument();
  });

  it("clears recent notes from command palette action", () => {
    render(<App />);
    const notesList = screen.getByLabelText("Notes list");
    const card = Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
      entry.textContent?.includes("To-do list")
    );
    expect(card).toBeTruthy();
    fireEvent.click(card as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear recent notes" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(screen.getByText("No recent notes yet")).toBeInTheDocument();
  });

  it("shows guard toast when clearing recent notes from command palette with none saved", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear recent notes" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(screen.getByText("Recent notes are already empty")).toBeInTheDocument();
  });

  it("moves edited notes to the top of recent notes", async () => {
    render(<App />);
    const notesList = screen.getByLabelText("Notes list");
    const findCard = (title: string) =>
      Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
        entry.textContent?.includes(title)
      );
    const recentTitles = () =>
      Array.from(document.querySelectorAll<HTMLButtonElement>(".recent-item")).map(
        (entry) => entry.querySelector("span")?.textContent?.trim() ?? ""
      );

    const todoCard = findCard("To-do list");
    const agendaCard = findCard("Agenda");
    expect(todoCard).toBeTruthy();
    expect(agendaCard).toBeTruthy();

    fireEvent.click(todoCard as HTMLButtonElement);
    fireEvent.click(agendaCard as HTMLButtonElement);
    expect(recentTitles()[0]).toBe("Agenda");

    fireEvent.contextMenu(todoCard as HTMLButtonElement);
    const noteActionsMenu = screen.getByRole("menu", { name: "Note actions" });
    fireEvent.click(within(noteActionsMenu).getByRole("button", { name: /Rename/i }));

    const renameModal = screen.getByRole("heading", { name: "Rename note" }).closest("section");
    expect(renameModal).toBeTruthy();
    fireEvent.change(within(renameModal as HTMLElement).getByRole("textbox"), {
      target: { value: "To-do list edited" }
    });
    fireEvent.click(within(renameModal as HTMLElement).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(recentTitles()[0]).toBe("To-do list edited");
    });
  });

  it("filters graph nodes by query", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "To-do list" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filter graph"), { target: { value: "agenda" } });
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "To-do list" })).not.toBeInTheDocument();
  });

  it("supports local graph scope around active note", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Target\n\nLinked target" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Source\n\n[[Target]]" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    fireEvent.click(screen.getByRole("button", { name: "Local" }));

    const graphCanvas = screen.getByRole("img", { name: /Graph with/i });
    expect(within(graphCanvas).getByRole("button", { name: "Source" })).toBeInTheDocument();
    expect(within(graphCanvas).getByRole("button", { name: "Target" })).toBeInTheDocument();
    expect(within(graphCanvas).queryByRole("button", { name: "Agenda" })).not.toBeInTheDocument();
  });

  it("opens local graph for active note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open active note local graph" }
    });
    fireEvent.click(screen.getByText("Open active note local graph"));

    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("blocks local graph command palette action for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open active note local graph" }
    });
    fireEvent.click(screen.getByText("Open active note local graph"));

    expect(screen.getByText("Select one note to open local graph")).toBeInTheDocument();
  });

  it("persists graph scope preference", () => {
    const first = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    fireEvent.click(screen.getByRole("button", { name: "Local" }));
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
    first.unmount();

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("toggles focus mode from the editor topbar", () => {
    render(<App />);
    const shell = screen.getByRole("application", { name: "PKM OpenSource Shell" });
    expect(shell).not.toHaveClass("focus-mode");

    fireEvent.click(screen.getByRole("button", { name: "Focus" }));
    expect(shell).toHaveClass("focus-mode");

    fireEvent.click(screen.getByRole("button", { name: "Focus" }));
    expect(shell).not.toHaveClass("focus-mode");
  });

  it("opens the current notebook from the editor breadcrumb", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();

    const crumbs = document.querySelector(".editor-topbar .crumbs");
    expect(crumbs).toBeTruthy();

    fireEvent.click(within(crumbs as HTMLElement).getByRole("button", { name: "Daily Notes" }));
    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
  });

  it("opens note history from the edited header action", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: /^Edited /i }));
    expect(await screen.findByRole("heading", { name: /^History/i, level: 3 })).toBeInTheDocument();
  });

  it("toggles focus mode with keyboard shortcut", () => {
    render(<App />);
    const shell = screen.getByRole("application", { name: "PKM OpenSource Shell" });

    fireEvent.keyDown(window, { key: "\\", metaKey: true, shiftKey: true });
    expect(shell).toHaveClass("focus-mode");

    fireEvent.keyDown(window, { key: "\\", metaKey: true, shiftKey: true });
    expect(shell).not.toHaveClass("focus-mode");
  });

  it("toggles focus mode using Backslash keyboard code", () => {
    render(<App />);
    const shell = screen.getByRole("application", { name: "PKM OpenSource Shell" });

    fireEvent.keyDown(window, { key: "|", code: "Backslash", metaKey: true, shiftKey: true });
    expect(shell).toHaveClass("focus-mode");

    fireEvent.keyDown(window, { key: "|", code: "Backslash", metaKey: true, shiftKey: true });
    expect(shell).not.toHaveClass("focus-mode");
  });

  it("toggles backlinks pane with keyboard shortcut", () => {
    render(<App />);
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "b", metaKey: true, shiftKey: true });
    expect(screen.queryByLabelText("Backlinks dock")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "b", metaKey: true, shiftKey: true });
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();
  });

  it("toggles backlinks pane using KeyB keyboard code", () => {
    render(<App />);
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "∫", code: "KeyB", metaKey: true, shiftKey: true });
    expect(screen.queryByLabelText("Backlinks dock")).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: "∫", code: "KeyB", metaKey: true, shiftKey: true });
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();
  });

  it("exits focus mode with escape", () => {
    render(<App />);
    const shell = screen.getByRole("application", { name: "PKM OpenSource Shell" });
    fireEvent.click(screen.getByRole("button", { name: "Focus" }));
    expect(shell).toHaveClass("focus-mode");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(shell).not.toHaveClass("focus-mode");
  });

  it("opens note history with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "h", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText("No history yet")).toBeInTheDocument();
  });

  it("opens note history using KeyH keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "˙", code: "KeyH", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
  });

  it("blocks note history keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "h", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note to view history")).toBeInTheDocument();
  });

  it("opens note metadata with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "i", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("opens note metadata using KeyI keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "ˆ", code: "KeyI", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("copies note link and path from the metadata panel", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("pkm-os://note/Daily%20Notes%2FAgenda.md"));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy path" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("Daily Notes/Agenda.md"));
    expect(screen.getByText("Note path copied")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy metadata path Daily Notes/Agenda.md" }));
    await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("Daily Notes/Agenda.md"));
  });

  it("copies markdown, html, and text from the metadata panel", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy markdown" }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(String(writeText.mock.calls.at(-1)?.[0] ?? "")).toContain("# Agenda");
    expect(screen.getByText("Note markdown copied")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy HTML" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(2));
    expect(String(writeText.mock.calls.at(-1)?.[0] ?? "")).toContain("<h1>Agenda</h1>");
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy text" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(3));
    expect(String(writeText.mock.calls.at(-1)?.[0] ?? "")).toContain("Priority 1");
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("opens notebook and history from the metadata panel", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open metadata notebook Daily Notes" }));
    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();

    const refreshedMetadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(refreshedMetadataPanel).toBeTruthy();

    fireEvent.click(within(refreshedMetadataPanel as HTMLElement).getByRole("button", { name: "History" }));
    expect(await screen.findByRole("heading", { name: /^History/i, level: 3 })).toBeInTheDocument();
  });

  it("shares and duplicates the active note from the metadata panel", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Share" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("pkm-os://note/Daily%20Notes%2FAgenda.md"));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Duplicate" }));
    expect(await screen.findByText("1 duplicated")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agenda copy" })).toBeInTheDocument();
  });

  it("opens move dialog from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Move" }));
    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens rename and copy dialogs from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Copy to" }));
    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("opens tasks and reminders from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open tasks" }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open reminders" }));
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens local graph and find-in-note from the metadata panel", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Find in note" }));
    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open local graph" }));
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("opens files and calendar from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open files" }));
    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/No attachments found/i)).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open calendar" }));
    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("toggles template and shortcuts from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Remove from Templates" }));
    expect(within(metadataPanel as HTMLElement).getByRole("button", { name: "Set as template" })).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Add to shortcuts" }));
    expect(within(metadataPanel as HTMLElement).getByRole("button", { name: "Remove from shortcuts" })).toBeInTheDocument();
  });

  it("toggles home and notebook pins from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Pin to Home" }));
    expect(within(metadataPanel as HTMLElement).getByRole("button", { name: "Unpin from Home" })).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Pin to notebook" }));
    expect(within(metadataPanel as HTMLElement).getByRole("button", { name: "Unpin from notebook" })).toBeInTheDocument();
  });

  it("opens the active note in a new window from the metadata panel", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open in new window" }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("exports markdown, html, and text from the metadata panel", async () => {
    const anchorClick = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    const createObjectURL = vi.fn(() => "blob:pkm-os-test");
    const revokeObjectURL = vi.fn();
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation((
      (tagName: string, options?: ElementCreationOptions) => {
      const element = originalCreateElement(tagName, options);
      if (tagName.toLowerCase() === "a") {
        Object.defineProperty(element, "click", {
          value: anchorClick,
          configurable: true
        });
      }
      return element;
    }) as typeof document.createElement);

    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Export as Markdown" }));
    expect(await screen.findByText('Exported "Agenda"')).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Export as HTML" }));
    expect(await screen.findByText('Exported HTML "Agenda"')).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Export as Text" }));
    expect(await screen.findByText('Exported text "Agenda"')).toBeInTheDocument();

    expect(anchorClick).toHaveBeenCalledTimes(3);
    createElementSpy.mockRestore();
  });

  it("exports pdf and prints from the metadata panel", async () => {
    window.pkmShell = {
      ...window.pkmShell,
      getPlatform: window.pkmShell?.getPlatform ?? (() => "mac"),
      exportNotePdf: vi.fn().mockResolvedValue({
        ok: true,
        path: "/tmp/Agenda.pdf"
      })
    };
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Export as PDF" }));
    expect(await screen.findByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Print" }));
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("opens lite and full editor modes from the metadata panel", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open in Lite edit mode" }));
    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    const refreshedMetadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(refreshedMetadataPanel).toBeTruthy();

    fireEvent.click(within(refreshedMetadataPanel as HTMLElement).getByRole("button", { name: "Open in full editor" }));
    expect(screen.getByRole("button", { name: "Lite" })).not.toHaveClass("active");
    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens backlinks and current-note calendar from metadata counts", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Backlinks" }));
    expect(screen.queryByLabelText("Backlinks dock")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open metadata backlinks" }));
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open metadata events" }));
    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens local graph from metadata outgoing count", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Open metadata outgoing links" }));
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("opens a tag filter from metadata tags", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
    expect(metadataPanel).toBeTruthy();

    fireEvent.click(within(metadataPanel as HTMLElement).getByRole("button", { name: "Filter metadata tag focus" }));
    expect(screen.getByRole("heading", { name: "All Notes", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#focus ×" })).toBeInTheDocument();
  });

  it("blocks note metadata keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "i", metaKey: true, shiftKey: true });
    expect(screen.getByText("Select one note to view info")).toBeInTheDocument();
  });

  it("opens note tags editor with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "t", metaKey: true, altKey: true });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("opens note tags editor using KeyT keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "†", code: "KeyT", metaKey: true, altKey: true });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("prints the active note with keyboard shortcut", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<App />);

    fireEvent.keyDown(window, { key: "p", metaKey: true, altKey: true });
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("prints the active note using KeyP keyboard code", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<App />);

    fireEvent.keyDown(window, { key: "π", code: "KeyP", metaKey: true, altKey: true });
    expect(printSpy).toHaveBeenCalledTimes(1);

    printSpy.mockRestore();
  });

  it("opens tasks scoped to current note with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "j", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens tasks scoped to current note using KeyJ keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "∆", code: "KeyJ", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens files scoped to current note with keyboard shortcut", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.keyDown(window, { key: "f", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens files scoped to current note using KeyF keyboard code", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.keyDown(window, { key: "ƒ", code: "KeyF", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens calendar scoped to current note with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "c", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens calendar scoped to current note using KeyC keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "ç", code: "KeyC", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens reminders scoped to current note with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "u", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens reminders scoped to current note using KeyU keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "¨", code: "KeyU", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens bulk tags editor with keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "t", metaKey: true, altKey: true });
    const bulkTagModal = document.querySelector(".bulk-tag-modal") as HTMLElement | null;
    expect(bulkTagModal).toBeTruthy();
    expect(within(bulkTagModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("blocks reminders keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "u", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("blocks tasks, files, and calendar keyboard shortcuts for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "j", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note first")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "f", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note first")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "c", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("blocks print keyboard shortcut for multi-selected notes", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "p", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note to print")).toBeInTheDocument();
    expect(printSpy).not.toHaveBeenCalled();

    printSpy.mockRestore();
  });

  it("opens rename note dialog with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("blocks rename keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
    expect(screen.getByText("Select one note to rename")).toBeInTheDocument();
  });

  it("opens rename note dialog using KeyR code with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "®", code: "KeyR", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("rewrites incoming wikilinks when a note is renamed", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Agenda|Today Plan]]\n[[Agenda#Appointments]]" }
    });

    const notesList = screen.getByLabelText("Notes list");
    const findCard = (title: string) =>
      Array.from(notesList.querySelectorAll<HTMLButtonElement>("button.note-card")).find((entry) =>
        entry.textContent?.includes(title)
      );

    const agendaCard = findCard("Agenda");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    fireEvent.keyDown(window, { key: "r", metaKey: true, shiftKey: true });
    const renameModal = screen.getByRole("heading", { name: "Rename note", level: 3 }).closest("section");
    expect(renameModal).toBeTruthy();
    fireEvent.change(within(renameModal as HTMLElement).getByRole("textbox"), {
      target: { value: "Master Agenda" }
    });
    fireEvent.click(within(renameModal as HTMLElement).getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText('Renamed to "Master Agenda"')).toBeInTheDocument();
    });

    const linkSourceCard = findCard("Link Source");
    expect(linkSourceCard).toBeTruthy();
    fireEvent.click(linkSourceCard as HTMLButtonElement);

    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor?.value).toContain("[[Master Agenda|Today Plan]]");
    expect(editor?.value).toContain("[[Master Agenda#Appointments]]");
  });

  it("opens move note dialog with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "m", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens move note dialog using KeyM code with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "µ", code: "KeyM", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens move dialog for selected notes with keyboard shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "m", metaKey: true, altKey: true });
    const moveModal = screen.getByRole("heading", { name: "Move", level: 3 }).closest("section");
    expect(moveModal).toBeTruthy();
    expect(within(moveModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("copies note markdown with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "m", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("# Agenda");
    expect(screen.getByText("Note markdown copied")).toBeInTheDocument();
  });

  it("copies selected note markdown with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "m", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n---\n\n# To-do list");
    expect(screen.getByText("Markdown copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note markdown using KeyM code with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "µ", code: "KeyM", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note markdown copied")).toBeInTheDocument();
  });

  it("opens copy dialog with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "y", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("opens copy dialog using KeyY code with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "¥", code: "KeyY", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("opens copy dialog for selected notes with keyboard shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "y", metaKey: true, altKey: true });
    const copyModal = screen.getByRole("heading", { name: "Copy to", level: 3 }).closest("section");
    expect(copyModal).toBeTruthy();
    expect(within(copyModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("duplicates the active note with keyboard shortcut", async () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "d", metaKey: true, altKey: true });
    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("duplicates the active note using KeyD code with keyboard shortcut", async () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "∂", code: "KeyD", metaKey: true, altKey: true });
    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("duplicates selected notes with keyboard shortcut", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "d", metaKey: true, altKey: true });
    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /To-do list copy/i })).toBeInTheDocument();
  });

  it("blocks duplicate keyboard shortcut for trashed notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedAgenda = within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ });
    fireEvent.click(trashedAgenda);

    fireEvent.keyDown(window, { key: "d", metaKey: true, altKey: true });
    expect(screen.getByText("Restore note from Trash before duplicating")).toBeInTheDocument();
  });

  it("restores the active trashed note with keyboard shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedAgenda = within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ });
    fireEvent.click(trashedAgenda);

    fireEvent.keyDown(window, { key: "z", metaKey: true, altKey: true });
    expect(screen.getByText('"Agenda" restored from Trash')).toBeInTheDocument();
  });

  it("restores the active trashed note using KeyZ code with keyboard shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedAgenda = within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ });
    fireEvent.click(trashedAgenda);

    fireEvent.keyDown(window, { key: "Ω", code: "KeyZ", metaKey: true, altKey: true });
    expect(screen.getByText('"Agenda" restored from Trash')).toBeInTheDocument();
  });

  it("restores selected trashed notes with keyboard shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    expect(screen.getByText("2 notes moved to Trash")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(trashedCards[0] as HTMLButtonElement);
    fireEvent.click(trashedCards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "z", metaKey: true, altKey: true });
    expect(screen.getByText("2 notes restored from Trash")).toBeInTheDocument();
  });

  it("blocks restore keyboard shortcut for non-trashed notes", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "z", metaKey: true, altKey: true });
    expect(screen.getByText("Open a trashed note before restoring")).toBeInTheDocument();
  });

  it("copies note html with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "h", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<h1>Agenda</h1>");
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();
  });

  it("copies note html using KeyH keyboard code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "Ó", code: "KeyH", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();
  });

  it("copies selected note html with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "h", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<!-- --- -->");
    expect(screen.getByText("HTML copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note text with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "t", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("Priority 1");
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("copies note text using KeyT keyboard code", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "ˇ", code: "KeyT", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("copies selected note text with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "t", metaKey: true, shiftKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n\n---\n\n");
    expect(screen.getByText("Text copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note link with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "l", metaKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies note link from note header action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Link" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies note path from note header action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Path" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Daily Notes/Agenda.md"));
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("opens rename note dialog from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Rename" }));
    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("opens tag editor from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Tags" }));
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("opens note history from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "History" }));
    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
  });

  it("opens find in note from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Find" }));
    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens move dialog from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Move" }));
    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens copy dialog from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Copy" }));
    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("duplicates note from note header action", async () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Duplicate" }));
    expect(await screen.findByText("1 duplicated")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agenda copy" })).toBeInTheDocument();
  });

  it("toggles template state from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    const templateButton = within(headerActions as HTMLElement).getByRole("button", { name: "Template" });
    const initialPressed = templateButton.getAttribute("aria-pressed");

    fireEvent.click(templateButton);
    expect(within(headerActions as HTMLElement).getByRole("button", { name: "Template" })).toHaveAttribute(
      "aria-pressed",
      initialPressed === "true" ? "false" : "true"
    );
  });

  it("toggles shortcut state from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    const shortcutButton = within(headerActions as HTMLElement).getByRole("button", { name: "Shortcut" });
    const initialPressed = shortcutButton.getAttribute("aria-pressed");

    fireEvent.click(shortcutButton);
    expect(within(headerActions as HTMLElement).getByRole("button", { name: "Shortcut" })).toHaveAttribute(
      "aria-pressed",
      initialPressed === "true" ? "false" : "true"
    );
  });

  it("toggles home pin state from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    const homePinButton = within(headerActions as HTMLElement).getByRole("button", { name: "Home pin" });
    const initialPressed = homePinButton.getAttribute("aria-pressed");

    fireEvent.click(homePinButton);
    expect(within(headerActions as HTMLElement).getByRole("button", { name: "Home pin" })).toHaveAttribute(
      "aria-pressed",
      initialPressed === "true" ? "false" : "true"
    );
  });

  it("toggles notebook pin state from note header action", () => {
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    const notebookPinButton = within(headerActions as HTMLElement).getByRole("button", { name: "Notebook pin" });
    const initialPressed = notebookPinButton.getAttribute("aria-pressed");

    fireEvent.click(notebookPinButton);
    expect(within(headerActions as HTMLElement).getByRole("button", { name: "Notebook pin" })).toHaveAttribute(
      "aria-pressed",
      initialPressed === "true" ? "false" : "true"
    );
  });

  it("opens note in new window from note header action", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Window" }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("copies note link using KeyL code with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "¬", code: "KeyL", metaKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies selected note links with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "l", metaKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Links copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note path with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "l", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("copies selected note paths with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "l", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Paths copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note path using KeyL code with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "¬", code: "KeyL", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("copies note path from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy note path" }
    });
    fireEvent.click(screen.getByText("Copy note path"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("copies selected note paths from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy note path" }
    });
    fireEvent.click(screen.getByText("Copy note path"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Paths copied for 2 notes")).toBeInTheDocument();
  });

  it("shares note link with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "s", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("shares note link from note header action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    const headerActions = document.querySelector(".editor-top-actions") as HTMLElement | null;
    expect(headerActions).toBeTruthy();

    fireEvent.click(within(headerActions as HTMLElement).getByRole("button", { name: "Share" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("shares note link using KeyS code with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.keyDown(window, { key: "ß", code: "KeyS", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("shares selected note links with keyboard shortcut", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "s", metaKey: true, altKey: true });
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Share links copied for 2 notes")).toBeInTheDocument();
  });

  it("opens note in new window with keyboard shortcut", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);

    fireEvent.keyDown(window, { key: "o", metaKey: true });
    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("opens note in new window using KeyO code with keyboard shortcut", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);

    fireEvent.keyDown(window, { key: "ø", code: "KeyO", metaKey: true });
    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("blocks opening note in new window with keyboard shortcut for multi-selected notes", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "o", metaKey: true });
    expect(screen.getByText("Select one note to open in a new window")).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("opens note in lite edit mode with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("blocks opening note in lite edit with keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note to open in Lite edit mode")).toBeInTheDocument();
  });

  it("opens note in full editor with keyboard shortcut", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.getByRole("button", { name: "Lite" })).toHaveClass("active");

    fireEvent.keyDown(window, { key: "o", metaKey: true, shiftKey: true });
    expect(screen.getByRole("button", { name: "Lite" })).not.toHaveClass("active");
    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens note in full editor using KeyO code with keyboard shortcut", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.getByRole("button", { name: "Lite" })).toHaveClass("active");

    fireEvent.keyDown(window, { key: "ø", code: "KeyO", metaKey: true, shiftKey: true });
    expect(screen.getByRole("button", { name: "Lite" })).not.toHaveClass("active");
  });

  it("opens local graph with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "g", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("opens local graph using KeyG code with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "©", code: "KeyG", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("blocks local graph keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "g", metaKey: true, shiftKey: true });
    expect(screen.getByText("Select one note to open local graph")).toBeInTheDocument();
  });

  it("toggles the active note template with keyboard shortcut", async () => {
    render(<App />);
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "5", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();
    });

    fireEvent.keyDown(window, { key: "5", metaKey: true, altKey: true });
    expect(await screen.findByText('You are editing your "Agenda" template')).toBeInTheDocument();
  });

  it("toggles the active note template using Digit5 code with keyboard shortcut", async () => {
    render(<App />);
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "[", code: "Digit5", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();
    });
  });

  it("toggles selected note shortcuts with keyboard shortcut", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "6", metaKey: true, altKey: true });
    await waitFor(() => {
      const shortcutsButton = screen.getByRole("button", { name: "Shortcuts" });
      expect(within(shortcutsButton).getByText("2")).toBeInTheDocument();
    });
  });

  it("toggles selected note shortcuts using Digit6 code with keyboard shortcut", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "^", code: "Digit6", metaKey: true, altKey: true });
    await waitFor(() => {
      const shortcutsButton = screen.getByRole("button", { name: "Shortcuts" });
      expect(within(shortcutsButton).getByText("2")).toBeInTheDocument();
    });
  });

  it("toggles the active note home pin with keyboard shortcut", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from home Agenda"));

    fireEvent.keyDown(window, { key: "7", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from home Agenda"))).toBe(!wasPinned);
    });

    fireEvent.keyDown(window, { key: "7", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from home Agenda"))).toBe(wasPinned);
    });
  });

  it("toggles the active note home pin using Digit7 code with keyboard shortcut", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from home Agenda"));

    fireEvent.keyDown(window, { key: "&", code: "Digit7", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from home Agenda"))).toBe(!wasPinned);
    });
  });

  it("toggles the active note notebook pin with keyboard shortcut", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from notebook Agenda"));

    fireEvent.keyDown(window, { key: "8", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from notebook Agenda"))).toBe(!wasPinned);
    });

    fireEvent.keyDown(window, { key: "8", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from notebook Agenda"))).toBe(wasPinned);
    });
  });

  it("toggles the active note notebook pin using Digit8 code with keyboard shortcut", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from notebook Agenda"));

    fireEvent.keyDown(window, { key: "*", code: "Digit8", metaKey: true, altKey: true });
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from notebook Agenda"))).toBe(!wasPinned);
    });
  });

  it("exports the active note as markdown with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.keyDown(window, { key: "1", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports the active note as markdown using Digit1 code with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-code");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.keyDown(window, { key: "¡", code: "Digit1", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as HTML with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "2", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported HTML for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as HTML using Digit2 code with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html-code");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "@", code: "Digit2", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported HTML for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as text with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "3", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported text for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as text using Digit3 code with keyboard shortcut", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text-code");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "#", code: "Digit3", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported text for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports the active note as PDF with keyboard shortcut", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.keyDown(window, { key: "4", metaKey: true, altKey: true });

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();
  });

  it("exports the active note as PDF using Digit4 code with keyboard shortcut", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda-code.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.keyDown(window, { key: "$", code: "Digit4", metaKey: true, altKey: true });

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda-code.pdf")).toBeInTheDocument();
  });

  it("blocks PDF export keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "4", metaKey: true, altKey: true });
    expect(screen.getByText("Select one note to export PDF")).toBeInTheDocument();
  });

  it("blocks opening note in full editor with keyboard shortcut for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "o", metaKey: true, shiftKey: true });
    expect(screen.getByText("Select one note to open in full editor")).toBeInTheDocument();
  });

  it("opens notes from graph node clicks", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    fireEvent.click(screen.getByRole("button", { name: "To-do list" }));
    expect(screen.queryByLabelText("Graph view")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "To-do list", level: 2 })).toBeInTheDocument();
  });

  it("navigates note cards with arrow keys", () => {
    render(<App />);
    const notesList = screen.getByLabelText("Notes list");
    const cards = notesList.querySelectorAll<HTMLButtonElement>("button.note-card");
    expect(cards.length).toBeGreaterThan(1);

    const firstCard = cards[0];
    const secondCard = cards[1];
    const secondTitle = secondCard?.querySelector("strong")?.textContent?.trim();
    expect(secondTitle).toBeTruthy();

    firstCard?.focus();
    fireEvent.keyDown(firstCard as HTMLButtonElement, { key: "ArrowDown" });

    expect(screen.getByRole("heading", { name: secondTitle as string, level: 2 })).toBeInTheDocument();
  });

  it("cycles note grouping modes and persists preference", () => {
    const first = render(<App />);
    expect(document.querySelectorAll(".note-group-heading").length).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Group: Off" }));
    fireEvent.click(screen.getByRole("button", { name: "Updated date" }));
    expect(document.querySelectorAll(".note-group-heading").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Group: Updated" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Group: Updated" }));
    fireEvent.click(screen.getByRole("button", { name: "Notebook" }));
    expect(screen.getByRole("button", { name: "Group: Notebook" })).toHaveClass("active");
    const groupHeadings = Array.from(document.querySelectorAll(".note-group-heading")).map((entry) =>
      entry.textContent?.trim()
    );
    expect(groupHeadings).toContain("Daily Notes");

    first.unmount();

    render(<App />);
    expect(screen.getByRole("button", { name: "Group: Notebook" })).toBeInTheDocument();
    expect(document.querySelectorAll(".note-group-heading").length).toBeGreaterThan(0);
  });

  it("groups notes by primary tag in tag grouping mode", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Group: Off" }));
    fireEvent.click(screen.getByRole("button", { name: "Updated date" }));
    fireEvent.click(screen.getByRole("button", { name: "Group: Updated" }));
    fireEvent.click(screen.getByRole("button", { name: "Notebook" }));
    fireEvent.click(screen.getByRole("button", { name: "Group: Notebook" }));
    fireEvent.click(screen.getByRole("button", { name: "Tag" }));

    expect(screen.getByRole("button", { name: "Group: Tag" })).toBeInTheDocument();
    const groupHeadings = Array.from(document.querySelectorAll(".note-group-heading")).map((entry) =>
      entry.textContent?.trim()
    );
    expect(groupHeadings).toContain("#focus");
    expect(groupHeadings).toContain("Untagged");
  });

  it("persists editor typography toolbar preferences", () => {
    const first = render(<App />);
    const familySelect = screen.getByLabelText("Editor font family") as HTMLSelectElement;
    const sizeSelect = screen.getByLabelText("Editor font size") as HTMLSelectElement;

    fireEvent.change(familySelect, { target: { value: "georgia" } });
    fireEvent.change(sizeSelect, { target: { value: "18" } });

    expect(familySelect.value).toBe("georgia");
    expect(sizeSelect.value).toBe("18");
    const editorMain = document.querySelector(".editor-main") as HTMLElement | null;
    expect(editorMain).toBeTruthy();
    expect((editorMain as HTMLElement).style.getPropertyValue("--editor-font-size")).toBe("18px");
    expect((editorMain as HTMLElement).style.getPropertyValue("--editor-font-family")).toContain("Georgia");

    first.unmount();

    render(<App />);
    expect(screen.getByLabelText("Editor font family")).toHaveValue("georgia");
    expect(screen.getByLabelText("Editor font size")).toHaveValue("18");
  });

  it("loads note list incrementally", () => {
    render(<App />);
    const createButton = screen.getByRole("button", { name: "+ Note" });
    for (let index = 0; index < 26; index += 1) {
      fireEvent.click(createButton);
    }

    const notesList = screen.getByLabelText("Notes list");
    const initialCardCount = notesList.querySelectorAll(".note-card").length;
    const loadMoreButton = screen.getByRole("button", { name: "Load more notes" });
    expect(loadMoreButton).toBeInTheDocument();

    fireEvent.click(loadMoreButton);
    const expandedCardCount = notesList.querySelectorAll(".note-card").length;
    expect(expandedCardCount).toBeGreaterThan(initialCardCount);
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

  it("opens command palette using KeyK keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "˚", code: "KeyK", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Command palette", level: 4 })).toBeInTheDocument();
  });

  it("opens quick search using KeyP keyboard code", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "π", code: "KeyP", metaKey: true });
    expect(screen.getByPlaceholderText("Search or ask a question")).toBeInTheDocument();
  });

  it("opens reminders from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">reminders" }
    });
    fireEvent.click(screen.getByText("Open reminders"));

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByText("No reminders scheduled.")).toBeInTheDocument();
  });

  it("sets reminders filter from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders filter overdue" }
    });
    fireEvent.click(screen.getByText("Set reminders filter: Overdue"));
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Overdue" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders filter all" }
    });
    fireEvent.click(screen.getByText("Set reminders filter: All"));
    expect(screen.getByRole("button", { name: "All" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("sets reminders scope from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders scope current note" }
    });
    fireEvent.click(screen.getByText("Set reminders scope: Current note"));

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves reminder scope when changing reminder filter from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders scope current note" }
    });
    fireEvent.click(screen.getByText("Set reminders scope: Current note"));
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders filter overdue" }
    });
    fireEvent.click(screen.getByText("Set reminders filter: Overdue"));
    expect(screen.getByRole("button", { name: "Overdue" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens reminders scoped to current note from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open reminders for current note" }
    });
    fireEvent.click(screen.getByText("Open reminders for current note"));

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("blocks current-note reminders scope action for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set reminders scope current note" }
    });
    fireEvent.click(screen.getByText("Set reminders scope: Current note"));

    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("opens templates from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open templates" }
    });
    fireEvent.click(screen.getByText("Open templates"));

    expect(screen.getByRole("heading", { name: "Templates", level: 1 })).toBeInTheDocument();
  });

  it("toggles active note template from command palette", () => {
    render(<App />);
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note template" }
    });
    fireEvent.click(screen.getByText("Toggle active note template"));

    expect(screen.getByText("1 removed from templates")).toBeInTheDocument();
    expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note template" }
    });
    fireEvent.click(screen.getByText("Toggle active note template"));

    expect(screen.getByText("1 marked as template")).toBeInTheDocument();
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();
  });

  it("toggles active note shortcut from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note shortcut" }
    });
    fireEvent.click(screen.getByText("Toggle active note shortcut"));
    expect(screen.getByText("1 added to shortcuts")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note shortcut" }
    });
    fireEvent.click(screen.getByText("Toggle active note shortcut"));
    expect(screen.getByText("1 removed from shortcuts")).toBeInTheDocument();
  });

  it("toggles active note home pin from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to home" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to home"));
    expect(screen.getByText("1 pinned to Home")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to home" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to home"));
    expect(screen.getByText("1 unpinned from Home")).toBeInTheDocument();
  });

  it("toggles active note notebook pin from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to notebook" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to notebook"));
    expect(screen.getByText("1 pinned to notebook")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to notebook" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to notebook"));
    expect(screen.getByText("1 unpinned from notebook")).toBeInTheDocument();
  });

  it("toggles selected note templates from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note template" }
    });
    fireEvent.click(screen.getByText("Toggle active note template"));

    expect(screen.getByText("2 marked as template")).toBeInTheDocument();
  });

  it("toggles selected note shortcuts from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note shortcut" }
    });
    fireEvent.click(screen.getByText("Toggle active note shortcut"));

    expect(screen.getByText("2 added to shortcuts")).toBeInTheDocument();
  });

  it("toggles selected note home pins from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to home" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to home"));

    expect(screen.getByText("2 pinned to Home")).toBeInTheDocument();
  });

  it("toggles selected note notebook pins from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to notebook" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to notebook"));

    expect(screen.getByText("2 pinned to notebook")).toBeInTheDocument();
  });

  it("opens tasks modal scoped to current note from command palette", () => {
    render(<App />);

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n- [ ] Agenda task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n- [ ] Capture task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open tasks for current note" }
    });
    fireEvent.click(screen.getByText("Open tasks for current note"));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText("Capture task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).queryByRole("button", { name: /Agenda task/i })).not.toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("sets task due filter from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks filter upcoming" }
    });
    fireEvent.click(screen.getByText("Set tasks filter: Upcoming"));

    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Upcoming \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks filter all" }
    });
    fireEvent.click(screen.getByText("Set tasks filter: All"));

    expect(screen.getByRole("button", { name: /^All \(/ })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves tasks scope when changing task filter from command palette", () => {
    render(<App />);

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n- [ ] Agenda task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n- [ ] Capture task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks scope current note" }
    });
    fireEvent.click(screen.getByText("Set tasks scope: Current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks filter overdue" }
    });
    fireEvent.click(screen.getByText("Set tasks filter: Overdue"));
    expect(screen.getByRole("button", { name: /^Overdue \(/ })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("sets tasks scope to current note from command palette actions", () => {
    render(<App />);

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n- [ ] Agenda task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n- [ ] Capture task" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks scope current note" }
    });
    fireEvent.click(screen.getByText("Set tasks scope: Current note"));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText("Capture task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).queryByRole("button", { name: /Agenda task/i })).not.toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("sets tasks sort mode from command palette actions", () => {
    render(<App />);

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n- [ ] Task one due:2030-01-01\n- [ ] Task two due:2030-01-03" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks sort due latest" }
    });
    fireEvent.click(screen.getByText("Set tasks sort: Due latest"));

    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Due latest" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves tasks scope when changing task sort from command palette", () => {
    render(<App />);

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n- [ ] Agenda task due:2030-01-01" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n- [ ] Capture task due:2030-01-03" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks scope current note" }
    });
    fireEvent.click(screen.getByText("Set tasks scope: Current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set tasks sort due latest" }
    });
    fireEvent.click(screen.getByText("Set tasks sort: Due latest"));
    expect(screen.getByRole("button", { name: "Due latest" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("blocks current-note tasks action from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open tasks for current note" }
    });
    fireEvent.click(screen.getByText("Open tasks for current note"));

    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("opens files modal scoped to current note from command palette", () => {
    render(<App />);

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const secondEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(secondEditor).toBeTruthy();
    fireEvent.change(secondEditor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n![Photo shot](./attachments/photo.png)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open files for current note" }
    });
    fireEvent.click(screen.getByText("Open files for current note"));

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("sets files type filter from command palette actions", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n![Photo shot](./attachments/photo.png)\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files filter images" }
    });
    fireEvent.click(screen.getByText("Set files filter: Images"));

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Images \(/ })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves files scope when changing files filter from command palette", () => {
    render(<App />);
    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n![Photo shot](./attachments/photo.png)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files scope current note" }
    });
    fireEvent.click(screen.getByText("Set files scope: Current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files filter images" }
    });
    fireEvent.click(screen.getByText("Set files filter: Images"));
    expect(screen.getByRole("button", { name: /^Images \(/ })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
  });

  it("sets files scope to current note from command palette actions", () => {
    render(<App />);
    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n![Photo shot](./attachments/photo.png)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files scope current note" }
    });
    fireEvent.click(screen.getByText("Set files scope: Current note"));

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("sets files sort mode from command palette actions", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Zed file](./attachments/z.pdf)\n[Ace file](./attachments/a.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files sort name a-z" }
    });
    fireEvent.click(screen.getByText("Set files sort: Name (A-Z)"));

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Name A-Z" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves files scope when changing files sort from command palette", () => {
    render(<App />);
    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n![Photo shot](./attachments/photo.png)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files scope current note" }
    });
    fireEvent.click(screen.getByText("Set files scope: Current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set files sort name a-z" }
    });
    fireEvent.click(screen.getByText("Set files sort: Name (A-Z)"));
    expect(screen.getByRole("button", { name: "Name A-Z" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("blocks current-note files action from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open files for current note" }
    });
    fireEvent.click(screen.getByText("Open files for current note"));

    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("opens calendar modal scoped to current note from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar" }
    });
    fireEvent.click(screen.getByText("Open calendar"));

    const firstCalendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(firstCalendarModal).toBeTruthy();
    const weeklyRow = within(firstCalendarModal as HTMLElement).getByText("Weekly planning").closest(".calendar-row");
    expect(weeklyRow).toBeTruthy();
    fireEvent.click(
      within(weeklyRow as HTMLElement).getByRole("button", { name: "Link active note for Weekly planning" })
    );
    fireEvent.click(within(firstCalendarModal as HTMLElement).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar for current note" }
    });
    fireEvent.click(screen.getByText("Open calendar for current note"));

    const scopedCalendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(scopedCalendarModal).toBeTruthy();
    expect(within(scopedCalendarModal as HTMLElement).getByText("Weekly planning")).toBeInTheDocument();
    expect(within(scopedCalendarModal as HTMLElement).queryByText("Research block")).not.toBeInTheDocument();
    expect(within(scopedCalendarModal as HTMLElement).getByRole("button", { name: /^Current note \(/ })).toHaveClass(
      "active"
    );
  });

  it("sets calendar sort from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set calendar sort latest" }
    });
    fireEvent.click(screen.getByText("Set calendar sort: Latest"));

    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Latest" })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves calendar scope when changing calendar sort from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar" }
    });
    fireEvent.click(screen.getByText("Open calendar"));
    const firstCalendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(firstCalendarModal).toBeTruthy();
    const weeklyRow = within(firstCalendarModal as HTMLElement).getByText("Weekly planning").closest(".calendar-row");
    expect(weeklyRow).toBeTruthy();
    fireEvent.click(
      within(weeklyRow as HTMLElement).getByRole("button", { name: "Link active note for Weekly planning" })
    );
    fireEvent.click(within(firstCalendarModal as HTMLElement).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar for current note" }
    });
    fireEvent.click(screen.getByText("Open calendar for current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set calendar sort latest" }
    });
    fireEvent.click(screen.getByText("Set calendar sort: Latest"));
    expect(screen.getByRole("button", { name: "Latest" })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("sets calendar filter from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set calendar filter events" }
    });
    fireEvent.click(screen.getByText("Set calendar filter: Events"));

    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Events \(/ })).toHaveClass("active");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("preserves calendar scope when changing calendar filter from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar" }
    });
    fireEvent.click(screen.getByText("Open calendar"));
    const firstCalendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(firstCalendarModal).toBeTruthy();
    const weeklyRow = within(firstCalendarModal as HTMLElement).getByText("Weekly planning").closest(".calendar-row");
    expect(weeklyRow).toBeTruthy();
    fireEvent.click(
      within(weeklyRow as HTMLElement).getByRole("button", { name: "Link active note for Weekly planning" })
    );
    fireEvent.click(within(firstCalendarModal as HTMLElement).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar for current note" }
    });
    fireEvent.click(screen.getByText("Open calendar for current note"));
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set calendar filter events" }
    });
    fireEvent.click(screen.getByText("Set calendar filter: Events"));
    expect(screen.getByRole("button", { name: /^Events \(/ })).toHaveClass("active");
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("blocks current-note calendar action from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open calendar for current note" }
    });
    fireEvent.click(screen.getByText("Open calendar for current note"));

    expect(screen.getByText("Select one note first")).toBeInTheDocument();
  });

  it("sets graph scope to local from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">graph scope local" }
    });
    fireEvent.click(screen.getByText("Set graph scope: Local"));

    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("cycles grouping mode from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle note grouping" }
    });
    fireEvent.click(screen.getByText("Toggle note grouping"));
    expect(screen.getByRole("button", { name: "Group: Updated" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle note grouping" }
    });
    fireEvent.click(screen.getByText("Toggle note grouping"));
    expect(screen.getByRole("button", { name: "Group: Notebook" })).toBeInTheDocument();
  });

  it("sets note sort mode from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set sort title z-a" }
    });
    fireEvent.click(screen.getByText("Set sort: Title (Z-A)"));

    const titles = Array.from(document.querySelectorAll(".note-card strong")).map((node) => node.textContent ?? "");
    const sorted = [...titles].sort((left, right) => right.localeCompare(left));
    expect(titles).toEqual(sorted);
    expect(screen.getByText("Sort set to Title (Z-A)")).toBeInTheDocument();
  });

  it("sets note view and density from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set view list" }
    });
    fireEvent.click(screen.getByText("Set view: List"));

    const listGrid = document.querySelector(".note-grid");
    expect(listGrid).toHaveClass("list-mode");
    expect(screen.getByText("View set to List")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set density compact" }
    });
    fireEvent.click(screen.getByText("Set density: Compact"));

    expect(document.querySelector(".note-grid")).toHaveClass("compact");
    expect(screen.getByText("Density set to Compact")).toBeInTheDocument();
  });

  it("sets note grouping from command palette actions", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set grouping tag" }
    });
    fireEvent.click(screen.getByText("Set grouping: Tag"));

    expect(screen.getByRole("button", { name: "Group: Tag" })).toBeInTheDocument();
    expect(screen.getByText("Grouping set to Tag")).toBeInTheDocument();
  });

  it("toggles collapsible sections from command palette action", () => {
    render(<App />);
    expect(document.querySelector(".preview-section")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle collapsible sections" }
    });
    fireEvent.click(screen.getByText("Toggle collapsible sections"));
    expect(document.querySelector(".preview-section")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle collapsible sections" }
    });
    fireEvent.click(screen.getByText("Toggle collapsible sections"));
    expect(document.querySelector(".preview-section")).toBeNull();
  });

  it("toggles backlinks pane from command palette action", () => {
    render(<App />);
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle backlinks pane" }
    });
    fireEvent.click(screen.getByText("Toggle backlinks pane"));
    expect(screen.queryByLabelText("Backlinks dock")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle backlinks pane" }
    });
    fireEvent.click(screen.getByText("Toggle backlinks pane"));
    expect(screen.getByLabelText("Backlinks dock")).toBeInTheDocument();
  });

  it("sets explicit theme from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set theme sky" }
    });
    fireEvent.click(screen.getByText("Set theme: Sky"));

    expect(document.documentElement.dataset.theme).toBe("sky");
    expect(screen.getByText("Theme switched to sky")).toBeInTheDocument();
  });

  it("sets editor font from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set editor font georgia" }
    });
    fireEvent.click(screen.getByText("Set editor font: Georgia"));

    expect(screen.getByLabelText("Editor font family")).toHaveValue("georgia");
    expect(screen.getByText("Editor font set to Georgia")).toBeInTheDocument();
  });

  it("sets editor font size from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set editor size large" }
    });
    fireEvent.click(screen.getByText("Set editor size: Large"));

    expect(screen.getByLabelText("Editor font size")).toHaveValue("18");
    expect(screen.getByText("Editor font size set to 18")).toBeInTheDocument();
  });

  it("opens new stack modal from command palette action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">new stack" }
    });
    fireEvent.click(screen.getByText("New stack"));

    expect(screen.getByRole("heading", { name: "New stack", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Stack name"), { target: { value: "Planning" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(screen.getByRole("button", { name: /Planning/i })).toBeInTheDocument();
  });

  it("opens move current notebook to stack from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move current notebook to stack" }
    });
    fireEvent.click(screen.getByText("Move current notebook to stack"));

    expect(screen.getByRole("heading", { name: /Move "Daily Notes" to stack/i, level: 3 })).toBeInTheDocument();
  });

  it("opens rename current notebook from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.click(dailyNotebook() as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">rename current notebook" }
    });
    fireEvent.click(screen.getByText("Rename current notebook"));

    expect(screen.getByRole("heading", { name: "Rename notebook", level: 3 })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Daily Notes")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("guards rename current notebook from command palette when all notes is selected", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">rename current notebook" }
    });
    fireEvent.click(screen.getByText("Rename current notebook"));

    expect(screen.getByText("Select a notebook first")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes current notebook from stack from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    expect(dailyNotebook()).toBeTruthy();

    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove current notebook from stack" }
    });
    fireEvent.click(screen.getByText("Remove current notebook from stack"));

    expect(screen.getByText('Removed "Daily Notes" from stack')).toBeInTheDocument();
  });

  it("reports when removing current notebook from stack while unstacked", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove current notebook from stack" }
    });
    fireEvent.click(screen.getByText("Remove current notebook from stack"));

    expect(screen.getByText('"Daily Notes" is not in a stack')).toBeInTheDocument();
  });

  it("opens note history from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">history" }
    });
    fireEvent.click(screen.getByText("Open note history"));

    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
    expect(screen.getByText("No history yet")).toBeInTheDocument();
  });

  it("blocks note history from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">history" }
    });
    fireEvent.click(screen.getByText("Open note history"));

    expect(screen.getByText("Select one note to view history")).toBeInTheDocument();
  });

  it("opens note metadata from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">info" }
    });
    fireEvent.click(screen.getByText("Open note info"));

    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("blocks note metadata from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">info" }
    });
    fireEvent.click(screen.getByText("Open note info"));

    expect(screen.getByText("Select one note to view info")).toBeInTheDocument();
  });

  it("opens note tags editor from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">tags" }
    });
    fireEvent.click(screen.getByText("Edit note tags"));

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("blocks note tags editor from command palette for trashed notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">edit note tags" }
    });
    fireEvent.click(screen.getByText("Edit note tags"));

    expect(screen.getByText("Restore notes from Trash to edit tags")).toBeInTheDocument();
  });

  it("opens bulk tags editor for selected notes from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">edit note tags" }
    });
    fireEvent.click(screen.getByText("Edit note tags"));

    const bulkTagModal = document.querySelector(".bulk-tag-modal") as HTMLElement | null;
    expect(bulkTagModal).toBeTruthy();
    expect(within(bulkTagModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("opens rename note dialog from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">rename" }
    });
    fireEvent.click(screen.getByText("Rename note"));

    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("blocks rename from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">rename note" }
    });
    fireEvent.click(screen.getByText("Rename note"));

    expect(screen.getByText("Select one note to rename")).toBeInTheDocument();
  });

  it("opens move note dialog from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move" }
    });
    fireEvent.click(screen.getByText("Move note"));

    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens move dialog for selected notes from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move note" }
    });
    fireEvent.click(screen.getByText("Move note"));

    const moveModal = screen.getByRole("heading", { name: "Move", level: 3 }).closest("section");
    expect(moveModal).toBeTruthy();
    expect(within(moveModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("opens copy dialog for selected notes from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy note to notebook" }
    });
    fireEvent.click(screen.getByText("Copy note to notebook"));

    const copyModal = screen.getByRole("heading", { name: "Copy to", level: 3 }).closest("section");
    expect(copyModal).toBeTruthy();
    expect(within(copyModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("confirms move dialog with enter key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move note" }
    });
    fireEvent.click(screen.getByText("Move note"));

    const dialogInput = screen.getByPlaceholderText("Find a location");
    fireEvent.change(dialogInput, { target: { value: "Inbox" } });
    fireEvent.keyDown(dialogInput, { key: "Enter" });

    expect(screen.queryByRole("heading", { name: "Move", level: 3 })).not.toBeInTheDocument();
    expect(screen.getByText(/moved to Inbox/)).toBeInTheDocument();
  });

  it("copies note link from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy link" }
    });
    fireEvent.click(screen.getByText("Copy note link"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies selected note links from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy link" }
    });
    fireEvent.click(screen.getByText("Copy note link"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Links copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note markdown from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy markdown" }
    });
    fireEvent.click(screen.getByText("Copy note markdown"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("# Agenda");
    expect(screen.getByText("Note markdown copied")).toBeInTheDocument();
  });

  it("copies selected notes markdown from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy markdown" }
    });
    fireEvent.click(screen.getByText("Copy note markdown"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n\n---\n\n");
    expect(screen.getByText("Markdown copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note html from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy note html" }
    });
    fireEvent.click(screen.getByText("Copy note HTML"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<h1>Agenda</h1>");
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();
  });

  it("copies selected notes html from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy note html" }
    });
    fireEvent.click(screen.getByText("Copy note HTML"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<!-- --- -->");
    expect(screen.getByText("HTML copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note text from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy text" }
    });
    fireEvent.click(screen.getByText("Copy note text"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("Priority 1");
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("copies selected notes text from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">copy text" }
    });
    fireEvent.click(screen.getByText("Copy note text"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n\n---\n\n");
    expect(screen.getByText("Text copied for 2 notes")).toBeInTheDocument();
  });

  it("shares note link from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">share note" }
    });
    fireEvent.click(screen.getByText("Share note link"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("shares selected note links from command palette", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">share note" }
    });
    fireEvent.click(screen.getByText("Share note link"));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("\n");
    expect(screen.getByText("Share links copied for 2 notes")).toBeInTheDocument();
  });

  it("opens note in new window from command palette", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">window" }
    });
    fireEvent.click(screen.getByText("Open note in new window"));

    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("blocks opening note in new window from command palette for multi-selected notes", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open note in new window" }
    });
    fireEvent.click(screen.getByText("Open note in new window"));

    expect(screen.getByText("Select one note to open in a new window")).toBeInTheDocument();
    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it("exports note as PDF from command palette", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note pdf" }
    });
    fireEvent.click(screen.getByText("Export note as PDF"));

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();
  });

  it("exports note as HTML from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note html" }
    });
    fireEvent.click(screen.getByText("Export note as HTML"));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported HTML "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as HTML from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note html" }
    });
    fireEvent.click(screen.getByText("Export note as HTML"));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported HTML for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports note as text from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note text" }
    });
    fireEvent.click(screen.getByText("Export note as Text"));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported text "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as text from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note text" }
    });
    fireEvent.click(screen.getByText("Export note as Text"));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported text for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports note markdown from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note markdown" }
    });
    fireEvent.click(screen.getByText("Export note as Markdown"));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected notes as markdown from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export note markdown" }
    });
    fireEvent.click(screen.getByText("Export note as Markdown"));

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(clickSpy).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Exported Markdown for 2 notes")).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports a vault snapshot from command palette", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-snapshot");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">export snapshot" }
    });
    fireEvent.click(screen.getByText("Export vault snapshot"));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Snapshot exported/i)).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("reloads vault notes from disk from command palette", async () => {
    const now = new Date().toISOString();
    const loadVaultState = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "disk-note-1",
          path: "Inbox/Disk Note.md",
          title: "Disk Note",
          snippet: "Loaded from disk.",
          tags: ["disk"],
          linksOut: [],
          createdAt: now,
          updatedAt: now,
          notebook: "Inbox",
          markdown: "# Disk Note\n\nLoaded from disk."
        }
      ])
      .mockResolvedValueOnce([
        {
          id: "disk-note-2",
          path: "Inbox/Disk Note Reloaded.md",
          title: "Disk Note Reloaded",
          snippet: "Reloaded from disk.",
          tags: ["disk"],
          linksOut: [],
          createdAt: now,
          updatedAt: now,
          notebook: "Inbox",
          markdown: "# Disk Note Reloaded\n\nReloaded from disk."
        }
      ]);
    (window as unknown as { pkmShell?: { loadVaultState: typeof loadVaultState } }).pkmShell = { loadVaultState };

    render(<App />);
    await waitFor(() => expect(screen.getByRole("heading", { name: "Disk Note", level: 2 })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">reload vault" }
    });
    fireEvent.click(screen.getByText("Reload vault from disk"));

    await waitFor(() => expect(screen.getByRole("heading", { name: "Disk Note Reloaded", level: 2 })).toBeInTheDocument());
  });

  it("shows unavailable toast when reloading vault in local mode", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">reload vault" }
    });
    fireEvent.click(screen.getByText("Reload vault from disk"));

    expect(screen.getByText("Vault reload is unavailable in this build")).toBeInTheDocument();
  });

  it("opens snapshot picker from command palette", () => {
    render(<App />);
    const input = document.getElementById("vault-snapshot-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">import snapshot" }
    });
    fireEvent.click(screen.getByText("Import vault snapshot"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("opens ENEX picker from command palette", () => {
    render(<App />);
    const input = document.getElementById("enex-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">import enex" }
    });
    fireEvent.click(screen.getByText("Import ENEX archive"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("opens markdown import picker from command palette", () => {
    render(<App />);
    const input = document.getElementById("markdown-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">import markdown files" }
    });
    fireEvent.click(screen.getByText("Import Markdown files"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("opens text import picker from command palette", () => {
    render(<App />);
    const input = document.getElementById("text-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">import text files" }
    });
    fireEvent.click(screen.getByText("Import Text files"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("opens html import picker from command palette", () => {
    render(<App />);
    const input = document.getElementById("html-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">import html files" }
    });
    fireEvent.click(screen.getByText("Import HTML files"));

    expect(clickSpy).toHaveBeenCalledTimes(1);
    clickSpy.mockRestore();
  });

  it("imports notes from a vault snapshot file", async () => {
    render(<App />);
    const input = document.getElementById("vault-snapshot-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const now = new Date().toISOString();
    const snapshot = {
      version: 1,
      createdAt: now,
      notes: [
        {
          id: "imported-note-1",
          path: "Imported/Imported Note.md",
          title: "Imported Note",
          snippet: "Recovered from snapshot.",
          tags: ["backup"],
          linksOut: [],
          createdAt: now,
          updatedAt: now,
          notebook: "Imported",
          markdown: "# Imported Note\n\nRecovered from snapshot."
        }
      ],
      calendarEvents: [],
      recentSearches: ["imported query"],
      homeScratchPad: "snapshot scratch"
    };

    const file = new File([JSON.stringify(snapshot)], "snapshot.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Imported Note", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported snapshot (1 notes)")).toBeInTheDocument();
  });

  it("imports notes from ENEX file", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("enex-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const enex = `<en-export><note><title>Imported ENEX Note</title><created>20260301T102030Z</created><updated>20260302T112233Z</updated><tag>imported</tag><note-attributes><source-url>https://example.com/source</source-url></note-attributes><content><![CDATA[<en-note><div>Hello from ENEX</div><div><en-todo checked="true"/> Done task</div></en-note>]]></content><resource><mime>application/pdf</mime><resource-attributes><file-name>Spec.pdf</file-name></resource-attributes></resource></note></en-export>`;
    const file = new File([enex], "Research-Archive.enex", { type: "application/xml" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Imported ENEX Note", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported ENEX (1 notes) into Research Archive")).toBeInTheDocument();
    const editor = document.querySelector("textarea.markdown-editor") as HTMLTextAreaElement | null;
    expect(editor?.value).toContain("Source: https://example.com/source");
    expect(editor?.value).toContain("- Spec.pdf");
  });

  it("imports notes from multiple ENEX files", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("enex-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const firstEnex =
      "<en-export><note><title>Alpha ENEX</title><created>20260301T102030Z</created><updated>20260302T112233Z</updated><content><![CDATA[<en-note><div>Alpha body</div></en-note>]]></content></note></en-export>";
    const secondEnex =
      "<en-export><note><title>Beta ENEX</title><created>20260303T102030Z</created><updated>20260304T112233Z</updated><content><![CDATA[<en-note><div>Beta body</div></en-note>]]></content></note></en-export>";

    const firstFile = new File([firstEnex], "First-Notebook.enex", { type: "application/xml" });
    const secondFile = new File([secondEnex], "Second-Notebook.enex", { type: "application/xml" });
    fireEvent.change(input, { target: { files: [firstFile, secondFile] } });

    await waitFor(() => expect(screen.getByRole("heading", { name: "Alpha ENEX", level: 2 })).toBeInTheDocument());
    expect(screen.getByText("Imported ENEX files (2 notes from 2 files)")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "All Notes", level: 1 })).toBeInTheDocument();
  });

  it("imports markdown files from picker", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("markdown-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const first = new File(["# Imported Alpha\n\nOne"], "Imported-Alpha.md", { type: "text/markdown" });
    const second = new File(["No heading content"], "Imported-Beta.markdown", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [first, second] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Imported Alpha", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported Markdown files (2) into Imported")).toBeInTheDocument();
  });

  it("imports text files from picker", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("text-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const first = new File(["First paragraph\nSecond paragraph"], "Imported-Notes.txt", { type: "text/plain" });
    const second = new File(["A quick reminder"], "Quick.text", { type: "text/plain" });
    fireEvent.change(input, { target: { files: [first, second] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Imported Notes", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported text files (2) into Imported")).toBeInTheDocument();
  });

  it("imports html files from picker", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("html-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const first = new File(["<html><body><h1>Imported HTML</h1><p>Converted content.</p></body></html>"], "Imported.html", {
      type: "text/html"
    });
    const second = new File(["<html><body><p>Second note body</p></body></html>"], "Second.htm", {
      type: "text/html"
    });
    fireEvent.change(input, { target: { files: [first, second] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Imported HTML", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported HTML files (2) into Imported")).toBeInTheDocument();
  });

  it("imports html title from document title when body has no heading", async () => {
    window.localStorage.setItem(
      "pkm-os.desktop.prefs.v1",
      JSON.stringify({
        selectedNotebook: "All Notes",
        activeId: ""
      })
    );
    render(<App />);
    const input = document.getElementById("html-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(["<html><head><title>From HTML Title</title></head><body><p>Body only.</p></body></html>"], "TitleOnly.html", {
      type: "text/html"
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "From HTML Title", level: 2 })).toBeInTheDocument()
    );
    expect(screen.getByText("Imported HTML files (1) into Imported")).toBeInTheDocument();
  });

  it("sets AI provider from command palette", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">set ai provider ollama" }
    });
    fireEvent.click(screen.getByText("Set AI provider: Ollama"));
    expect(screen.getByText("AI provider set to Ollama (Local)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));
    await waitFor(() => expect(screen.getByDisplayValue("Ollama (Local)")).toBeInTheDocument());
  });

  it("opens AI settings from command palette", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open ai settings" }
    });
    fireEvent.click(screen.getByText("Open AI settings"));

    await waitFor(() => expect(screen.getByRole("button", { name: "Hide settings" })).toBeInTheDocument());
    expect(screen.getByText("Provider")).toBeInTheDocument();
  });

  it("toggles AI pane from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle ai copilot pane" }
    });
    fireEvent.click(screen.getByText("Toggle AI copilot pane"));
    expect(screen.getByRole("heading", { name: "AI Copilot", level: 4 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle ai copilot pane" }
    });
    fireEvent.click(screen.getByText("Toggle AI copilot pane"));
    expect(screen.queryByRole("heading", { name: "AI Copilot", level: 4 })).not.toBeInTheDocument();
  });

  it("tests AI connection from command palette action", async () => {
    const testLlmConnection = vi.fn().mockResolvedValue({
      ok: true,
      detail: "Connected to provider"
    });
    (window as unknown as { pkmShell?: { testLlmConnection: typeof testLlmConnection } }).pkmShell = {
      testLlmConnection
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">test ai connection" }
    });
    fireEvent.click(screen.getByText("Test AI connection"));

    await waitFor(() => expect(screen.getByText("Connected to provider")).toBeInTheDocument());
  });

  it("fetches AI models from command palette action", async () => {
    const listLlmModels = vi.fn().mockResolvedValue({
      models: ["model-alpha", "model-beta"]
    });
    (window as unknown as { pkmShell?: { listLlmModels: typeof listLlmModels } }).pkmShell = {
      listLlmModels
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">fetch ai models" }
    });
    fireEvent.click(screen.getByText("Fetch AI models"));

    await waitFor(() => expect(screen.getByText("Loaded 2 models")).toBeInTheDocument());
    expect(screen.getByDisplayValue("model-alpha")).toBeInTheDocument();
  });

  it("toggles git backups from command palette action", async () => {
    const setGitBackupEnabled = vi.fn().mockResolvedValue({
      enabled: false,
      commitPrefix: "Vault backup",
      autosaveDelayMs: 4000,
      autoPush: false,
      pushRemote: "origin",
      pushBranch: "main",
      available: true,
      repoReady: true,
      dirty: false,
      busy: false,
      lastRunAt: null,
      lastCommitAt: null,
      lastCommitHash: "",
      lastError: ""
    });
    (window as unknown as { pkmShell?: { setGitBackupEnabled: typeof setGitBackupEnabled } }).pkmShell = {
      setGitBackupEnabled
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle git backups" }
    });
    fireEvent.click(screen.getByText("Toggle Git backups"));

    await waitFor(() => expect(setGitBackupEnabled).toHaveBeenCalledWith(false));
    expect(screen.getByText("Git backups disabled")).toBeInTheDocument();
  });

  it("runs git backup now from command palette action", async () => {
    const backupVaultToGit = vi.fn().mockResolvedValue({
      enabled: true,
      commitPrefix: "Vault backup",
      autosaveDelayMs: 4000,
      autoPush: false,
      pushRemote: "origin",
      pushBranch: "main",
      available: true,
      repoReady: true,
      dirty: false,
      busy: false,
      lastRunAt: "2026-03-04T16:00:00.000Z",
      lastCommitAt: "2026-03-04T16:00:00.000Z",
      lastCommitHash: "abc1234",
      lastError: ""
    });
    (window as unknown as { pkmShell?: { backupVaultToGit: typeof backupVaultToGit } }).pkmShell = {
      backupVaultToGit
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">run git backup now" }
    });
    fireEvent.click(screen.getByText("Run Git backup now"));

    await waitFor(() => expect(backupVaultToGit).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Git backup saved (abc1234)")).toBeInTheDocument();
  });

  it("shows validation message for invalid ENEX file", async () => {
    render(<App />);
    const input = document.getElementById("enex-import-input") as HTMLInputElement;
    expect(input).toBeTruthy();

    const file = new File(["<en-export><broken></en-export>"], "invalid.enex", { type: "application/xml" });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => expect(screen.getByText("No valid notes found in ENEX file")).toBeInTheDocument());
  });

  it("copies selected search result link with cmd+l in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "l", metaKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies selected search result link using KeyL code in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "¬", code: "KeyL", metaKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies selected search result path with alt+cmd+l in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "l", metaKey: true, altKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("copies selected search result path using KeyL code in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "¬", code: "KeyL", metaKey: true, altKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("opens selected search result in new window with cmd+o in search modal", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "o", metaKey: true });

    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("opens selected search result in new window using KeyO code in search modal", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "ø", code: "KeyO", metaKey: true });

    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("shares selected search result link with alt+cmd+s in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "s", metaKey: true, altKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("shares selected search result link using KeyS code in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "ß", code: "KeyS", metaKey: true, altKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("opens selected search result in lite edit mode with alt+cmd+o in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "o", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("opens selected search result in lite edit mode using KeyO code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "ø", code: "KeyO", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("opens selected search result in full editor with shift+cmd+o in search modal", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "o", metaKey: true, shiftKey: true });

    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result in full editor using KeyO code in search modal", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "ø", code: "KeyO", metaKey: true, shiftKey: true });

    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result local graph with shift+cmd+g in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "g", metaKey: true, shiftKey: true });

    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("opens selected search result note info with shift+cmd+i in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "i", metaKey: true, shiftKey: true });

    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("opens selected search result note info using KeyI code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "ˆ", code: "KeyI", metaKey: true, shiftKey: true });

    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("opens selected search result note history with alt+cmd+h in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "h", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result note history using KeyH code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "˙", code: "KeyH", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result tag editor with alt+cmd+t in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "t", metaKey: true, altKey: true });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("opens selected search result tag editor using KeyT code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "†", code: "KeyT", metaKey: true, altKey: true });

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("opens selected search result move dialog with alt+cmd+m in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "m", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result move dialog using KeyM code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "µ", code: "KeyM", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result copy dialog with alt+cmd+y in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "y", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result copy dialog using KeyY code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "÷", code: "KeyY", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result rename with alt+cmd+r in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "r", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("opens selected search result find-in-note with shift+cmd+f in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "f", metaKey: true, shiftKey: true });

    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens selected search result find-in-note using KeyF code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: ";", code: "KeyF", metaKey: true, shiftKey: true });

    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens selected search result tasks with alt+cmd+j in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "j", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens selected search result files with alt+cmd+f in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "f", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("No attachments found")).toBeInTheDocument();
  });

  it("opens selected search result calendar with alt+cmd+c in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "c", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens selected search result reminders with alt+cmd+u in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "u", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens selected search result reminders using KeyU code in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "¨", code: "KeyU", metaKey: true, altKey: true });

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("toggles selected search result template with alt+cmd+5 in search modal", async () => {
    render(<App />);
    const hadTemplateBanner = Boolean(screen.queryByText('You are editing your "Agenda" template'));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "5", metaKey: true, altKey: true });

    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
    if (hadTemplateBanner) {
      await waitFor(() => {
        expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();
      });
      return;
    }
    expect(await screen.findByText('You are editing your "Agenda" template')).toBeInTheDocument();
  });

  it("supports physical Digit5 shortcut code for quick search template toggle", async () => {
    render(<App />);
    const hadTemplateBanner = Boolean(screen.queryByText('You are editing your "Agenda" template'));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "[", code: "Digit5", metaKey: true, altKey: true });

    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
    if (hadTemplateBanner) {
      await waitFor(() => {
        expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();
      });
      return;
    }
    expect(await screen.findByText('You are editing your "Agenda" template')).toBeInTheDocument();
  });

  it("toggles selected search result shortcut with alt+cmd+6 in search modal", async () => {
    render(<App />);
    const hadShortcut = Boolean(screen.queryByRole("button", { name: "Remove shortcut Agenda" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "6", metaKey: true, altKey: true });

    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
    await waitFor(() => {
      if (hadShortcut) {
        expect(screen.queryByRole("button", { name: "Remove shortcut Agenda" })).not.toBeInTheDocument();
      } else {
        expect(screen.getByRole("button", { name: "Remove shortcut Agenda" })).toBeInTheDocument();
      }
    });
  });

  it("toggles selected search result home pin with alt+cmd+7 in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "7", metaKey: true, altKey: true });

    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
    expect(screen.getByText(/(pinned to Home|unpinned from Home)/i)).toBeInTheDocument();
  });

  it("toggles selected search result notebook pin with alt+cmd+8 in search modal", async () => {
    render(<App />);
    const hadNotebookPin = Boolean(screen.queryByRole("button", { name: "Unpin from notebook Agenda" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "8", metaKey: true, altKey: true });

    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
    await waitFor(() => {
      if (hadNotebookPin) {
        expect(screen.queryByRole("button", { name: "Unpin from notebook Agenda" })).not.toBeInTheDocument();
      } else {
        expect(screen.getByRole("button", { name: "Unpin from notebook Agenda" })).toBeInTheDocument();
      }
    });
  });

  it("exports selected search result markdown with alt+cmd+1 in search modal", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "1", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected search result HTML with alt+cmd+2 in search modal", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "2", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported HTML "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected search result HTML using Digit2 code in search modal", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html-code");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "@", code: "Digit2", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported HTML "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected search result text with alt+cmd+3 in search modal", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "3", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported text "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected search result text using Digit3 code in search modal", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text-code");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "#", code: "Digit3", metaKey: true, altKey: true });

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported text "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected search result PDF with alt+cmd+4 in search modal", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "4", metaKey: true, altKey: true });

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();
  });

  it("exports selected search result PDF using Digit4 code in search modal", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda-code.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "$", code: "Digit4", metaKey: true, altKey: true });

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda-code.pdf")).toBeInTheDocument();
  });

  it("prints selected search result with alt+cmd+p in search modal", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "p", metaKey: true, altKey: true });

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("duplicates selected search result with alt+cmd+d in search modal", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "d", metaKey: true, altKey: true });

    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("moves selected search result to trash with alt+cmd+backspace in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Backspace", metaKey: true, altKey: true });

    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("restores trashed search result with alt+cmd+z in search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Backspace", metaKey: true, altKey: true });
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "z", metaKey: true, altKey: true });

    expect(screen.getByText('"Agenda" restored from Trash')).toBeInTheDocument();
  });

  it("opens note in lite edit mode from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">lite" }
    });
    fireEvent.click(screen.getByText("Open note in Lite edit mode"));

    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("blocks lite edit mode from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open note in lite edit mode" }
    });
    fireEvent.click(screen.getByText("Open note in Lite edit mode"));

    expect(screen.getByText("Select one note to open in Lite edit mode")).toBeInTheDocument();
  });

  it("opens note in full editor from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">lite" }
    });
    fireEvent.click(screen.getByText("Open note in Lite edit mode"));
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">full editor" }
    });
    fireEvent.click(screen.getByText("Open note in full editor"));

    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("blocks full editor action from command palette for multi-selected notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open note in full editor" }
    });
    fireEvent.click(screen.getByText("Open note in full editor"));

    expect(screen.getByText("Select one note to open in full editor")).toBeInTheDocument();
  });

  it("duplicates the active note from command palette", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">duplicate" }
    });
    fireEvent.click(screen.getByText("Duplicate note"));

    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("duplicates selected notes from command palette", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">duplicate note" }
    });
    fireEvent.click(screen.getByText("Duplicate note"));

    await waitFor(() => {
      expect(screen.getByText("2 duplicated")).toBeInTheDocument();
    });
  });

  it("moves the active note to trash from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByRole("heading", { name: "Trash", level: 1 })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("moves selected notes to trash from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    expect(screen.getByText("2 notes moved to Trash")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
  });

  it("restores selected trashed notes from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(trashedCards[0] as HTMLButtonElement);
    fireEvent.click(trashedCards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">restore note" }
    });
    fireEvent.click(screen.getByText("Restore note from Trash"));

    expect(screen.getByText("2 notes restored from Trash")).toBeInTheDocument();
  });

  it("deletes selected trashed notes permanently from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(trashedCards[0] as HTMLButtonElement);
    fireEvent.click(trashedCards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">delete note permanently" }
    });
    fireEvent.click(screen.getByText("Delete note permanently"));

    expect(screen.getByText("2 notes deleted permanently")).toBeInTheDocument();
  });

  it("restores the active trashed note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">restore note" }
    });
    fireEvent.click(screen.getByText("Restore note from Trash"));

    expect(screen.getByText('"Agenda" restored from Trash')).toBeInTheDocument();
  });

  it("requires an active trashed note for restore from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">restore note" }
    });
    fireEvent.click(screen.getByText("Restore note from Trash"));

    expect(screen.getByText("Open a trashed note before restoring")).toBeInTheDocument();
  });

  it("deletes the active trashed note permanently from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">trash note" }
    });
    fireEvent.click(screen.getByText("Move note to trash"));

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">delete note permanently" }
    });
    fireEvent.click(screen.getByText("Delete note permanently"));

    expect(screen.getByText('"Agenda" deleted permanently')).toBeInTheDocument();
  });

  it("requires an active trashed note for permanent delete from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">delete note permanently" }
    });
    fireEvent.click(screen.getByText("Delete note permanently"));

    expect(screen.getByText("Move note to Trash before deleting permanently")).toBeInTheDocument();
  });

  it("opens or creates today's note from command palette without duplicates", async () => {
    render(<App />);
    const now = new Date();
    const todayTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">today" }
    });
    fireEvent.click(screen.getByText("Open today's note"));

    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
    const countBefore = Array.from(document.querySelectorAll(".note-card strong")).filter(
      (entry) => entry.textContent?.trim() === todayTitle
    ).length;
    expect(countBefore).toBe(1);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">today" }
    });
    fireEvent.click(screen.getByText("Open today's note"));

    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
    const countAfter = Array.from(document.querySelectorAll(".note-card strong")).filter(
      (entry) => entry.textContent?.trim() === todayTitle
    ).length;
    expect(countAfter).toBe(1);
  });

  it("opens or creates today's note from keyboard shortcut", async () => {
    render(<App />);
    const now = new Date();
    const todayTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.keyDown(window, { key: "D", metaKey: true, shiftKey: true });
    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
  });

  it("opens or creates today's note using KeyD keyboard code", async () => {
    render(<App />);
    const now = new Date();
    const todayTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.keyDown(window, { key: "Î", code: "KeyD", metaKey: true, shiftKey: true });
    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
  });

  it("opens or creates today's note from sidebar action", async () => {
    render(<App />);
    const now = new Date();
    const todayTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Open today's note" }));
    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
  });

  it("opens notebook from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open notebook daily notes" }
    });
    fireEvent.click(screen.getByText("Open notebook: Daily Notes"));

    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens all notes from command palette", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open notebook daily notes" }
    });
    fireEvent.click(screen.getByText("Open notebook: Daily Notes"));
    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open all notes" }
    });
    fireEvent.click(screen.getByText("Open all notes"));

    expect(screen.getByRole("heading", { name: "All Notes", level: 1 })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens tag filter from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open tag focus" }
    });
    fireEvent.click(screen.getByText("Open tag: #focus"));

    expect(screen.getByRole("heading", { name: "All Notes", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#focus ×" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens recent note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const targetCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(targetCard).toBeTruthy();
    fireEvent.click(targetCard as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open recent note to-do list" }
    });
    fireEvent.click(screen.getByText("Open recent note: To-do list"));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("# To-do list");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes recent note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const targetCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(targetCard).toBeTruthy();
    fireEvent.click(targetCard as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove recent note to-do list" }
    });
    fireEvent.click(screen.getByText("Remove recent note: To-do list"));

    expect(screen.getByText('Removed recent note "To-do list"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open recent note to-do list" }
    });
    expect(screen.queryByText("Open recent note: To-do list")).not.toBeInTheDocument();
  });

  it("opens shortcut note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(toDoCard).toBeTruthy();
    expect(agendaCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note shortcut" }
    });
    fireEvent.click(screen.getByText("Toggle active note shortcut"));

    fireEvent.click(agendaCard as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open shortcut note to-do list" }
    });
    fireEvent.click(screen.getByText("Open shortcut note: To-do list"));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("# To-do list");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes shortcut note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(toDoCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note shortcut" }
    });
    fireEvent.click(screen.getByText("Toggle active note shortcut"));
    expect(screen.getByRole("button", { name: "Remove shortcut To-do list" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove shortcut note to-do list" }
    });
    fireEvent.click(screen.getByText("Remove shortcut note: To-do list"));

    expect(screen.queryByRole("button", { name: "Remove shortcut To-do list" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed shortcut note "To-do list"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens shortcut notebook from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const otherNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Inbox"));

    expect(dailyNotebook()).toBeTruthy();
    expect(otherNotebook()).toBeTruthy();

    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Add notebook shortcut" }));
    fireEvent.click(otherNotebook() as HTMLButtonElement);
    expect(screen.queryByRole("heading", { name: "Daily Notes", level: 1 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open shortcut notebook daily notes" }
    });
    fireEvent.click(screen.getByText("Open shortcut notebook: Daily Notes"));

    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes shortcut notebook from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();

    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Add notebook shortcut" }));
    expect(screen.getByRole("button", { name: "Remove notebook shortcut Daily Notes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove shortcut notebook daily notes" }
    });
    fireEvent.click(screen.getByText("Remove shortcut notebook: Daily Notes"));

    expect(screen.queryByRole("button", { name: "Remove notebook shortcut Daily Notes" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed shortcut notebook "Daily Notes"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens shortcut tag from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.change(screen.getByLabelText("Add tag shortcut"), { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open shortcut tag focus" }
    });
    fireEvent.click(screen.getByText("Open shortcut tag: #focus"));

    expect(screen.getByRole("button", { name: "#focus ×" })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes shortcut tag from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    fireEvent.change(screen.getByLabelText("Add tag shortcut"), { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(screen.getByRole("button", { name: "Remove tag shortcut focus" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove shortcut tag focus" }
    });
    fireEvent.click(screen.getByText("Remove shortcut tag: #focus"));

    expect(screen.queryByRole("button", { name: "Remove tag shortcut focus" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed shortcut tag "#focus"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens recent search from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: ">open recent search agenda" } });
    fireEvent.click(screen.getByText("Open recent search: agenda"));

    expect((screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement).value).toBe("agenda");
    expect(screen.getByText("Results")).toBeInTheDocument();
  });

  it("removes recent search from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">remove recent search agenda" } });
    fireEvent.click(screen.getByText("Remove recent search: agenda"));

    expect(screen.getByText('Removed recent search "agenda"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.queryByRole("button", { name: "Remove recent search agenda" })).not.toBeInTheDocument();
  });

  it("opens home pinned note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(toDoCard).toBeTruthy();
    expect(agendaCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to home" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to home"));

    fireEvent.click(agendaCard as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open home pin to-do list" }
    });
    fireEvent.click(screen.getByText("Open home pin: To-do list"));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("# To-do list");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes home pinned note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(toDoCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to home" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to home"));
    expect(screen.getByRole("button", { name: "Unpin from home To-do list" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove home pin to-do list" }
    });
    fireEvent.click(screen.getByText("Remove home pin: To-do list"));

    expect(screen.queryByRole("button", { name: "Unpin from home To-do list" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed home pin "To-do list"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens notebook pinned note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(toDoCard).toBeTruthy();
    expect(agendaCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to notebook" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to notebook"));

    fireEvent.click(agendaCard as HTMLButtonElement);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open notebook pin to-do list" }
    });
    fireEvent.click(screen.getByText("Open notebook pin: To-do list"));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("# To-do list");
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("removes notebook pinned note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(toDoCard).toBeTruthy();

    fireEvent.click(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle active note pin to notebook" }
    });
    fireEvent.click(screen.getByText("Toggle active note pin to notebook"));
    expect(screen.getByRole("button", { name: "Unpin from notebook To-do list" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove notebook pin to-do list" }
    });
    fireEvent.click(screen.getByText("Remove notebook pin: To-do list"));

    expect(screen.queryByRole("button", { name: "Unpin from notebook To-do list" })).not.toBeInTheDocument();
    expect(screen.getByText('Removed notebook pin "To-do list"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("opens template note from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open template agenda" }
    });
    fireEvent.click(screen.getByText("Open template: Agenda"));

    expect(screen.getByRole("heading", { name: "Templates", level: 1 })).toBeInTheDocument();
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("unsets template note from command palette", () => {
    render(<App />);
    expect(screen.getByText('You are editing your "Agenda" template')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">unset template agenda" }
    });
    fireEvent.click(screen.getByText("Unset template: Agenda"));

    expect(screen.queryByText('You are editing your "Agenda" template')).not.toBeInTheDocument();
    expect(screen.getByText('Removed template "Agenda"')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("toggles stack collapse from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const stackedDailyNotebook = () =>
      (Array.from(document.querySelectorAll(".stack-group .notebook-item")) as HTMLButtonElement[]).find((entry) =>
        entry.textContent?.includes("Daily Notes")
      );

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(stackedDailyNotebook()).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle stack ops" }
    });
    fireEvent.click(screen.getByText("Toggle stack: Ops"));
    expect(stackedDailyNotebook()).toBeUndefined();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">toggle stack ops" }
    });
    fireEvent.click(screen.getByText("Toggle stack: Ops"));
    expect(stackedDailyNotebook()).toBeTruthy();
  });

  it("removes stack from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const stackedDailyNotebook = () =>
      (Array.from(document.querySelectorAll(".stack-group .notebook-item")) as HTMLButtonElement[]).find((entry) =>
        entry.textContent?.includes("Daily Notes")
      );

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stackedDailyNotebook()).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove stack ops" }
    });
    fireEvent.click(screen.getByText("Remove stack: Ops"));

    expect(screen.getByText('Removed stack "Ops". 1 notebook unstacked.')).toBeInTheDocument();
    expect(document.querySelector(".stack-group .notebook-item")).toBeNull();
    expect(
      Array.from(document.querySelectorAll(".notebook-item")).some((entry) => entry.textContent?.includes("Daily Notes"))
    ).toBe(true);
  });

  it("opens rename stack dialog from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">rename stack ops" }
    });
    fireEvent.click(screen.getByText("Rename stack: Ops"));

    expect(screen.getByRole("heading", { name: "Rename stack", level: 3 })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Ops")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("moves current notebook to an existing stack from command palette", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const inboxNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Inbox"));
    const stackedNotebook = (name: string) =>
      (Array.from(document.querySelectorAll(".stack-group .notebook-item")) as HTMLButtonElement[]).find((entry) =>
        entry.textContent?.includes(name)
      );

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(stackedNotebook("Daily Notes")).toBeTruthy();

    expect(inboxNotebook()).toBeTruthy();
    fireEvent.click(inboxNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move current notebook to stack ops" }
    });
    fireEvent.click(screen.getByText("Move current notebook to stack: Ops"));

    expect(screen.getByText('Moved "Inbox" to stack "Ops"')).toBeInTheDocument();
    expect(stackedNotebook("Inbox")).toBeTruthy();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("guards dynamic stack assignment when all notes is selected", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">move current notebook to stack ops" }
    });
    fireEvent.click(screen.getByText("Move current notebook to stack: Ops"));

    expect(screen.getByText("Select a notebook first")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
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

  it("opens home saved search edit action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "tag:meetings" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Meetings focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Edit home saved search Meetings focus" }));
    expect(screen.getByRole("heading", { name: "Edit saved search", level: 3 })).toBeInTheDocument();
  });

  it("removes saved search from home saved search action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "tag:meetings" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Meetings focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove home saved search Meetings focus" }));

    expect(screen.queryByRole("button", { name: "Edit home saved search Meetings focus" })).not.toBeInTheDocument();
    const homeDashboard = document.querySelector(".home-dashboard") as HTMLElement | null;
    expect(homeDashboard).toBeTruthy();
    expect(within(homeDashboard as HTMLElement).getByText("No saved searches yet")).toBeInTheDocument();
  });

  it("reopens notebook-scoped saved search in its saved notebook", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Daily scoped" } });
    fireEvent.change(screen.getByLabelText("Scope"), { target: { value: "current" } });
    fireEvent.change(screen.getByLabelText("Notebook"), { target: { value: "Daily Notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const notebookItems = Array.from(document.querySelectorAll(".notebook-item"));
    const alternateNotebook = notebookItems.find((entry) => !entry.textContent?.includes("Daily Notes"));
    expect(alternateNotebook).toBeTruthy();
    fireEvent.click(alternateNotebook as HTMLButtonElement);

    expect(screen.queryByRole("heading", { name: "Daily Notes", level: 1 })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^Daily scoped/i }));
    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
  });

  it("opens a saved search from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Daily scoped" } });
    fireEvent.change(screen.getByLabelText("Scope"), { target: { value: "current" } });
    fireEvent.change(screen.getByLabelText("Notebook"), { target: { value: "Daily Notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const notebookItems = Array.from(document.querySelectorAll(".notebook-item"));
    const alternateNotebook = notebookItems.find((entry) => !entry.textContent?.includes("Daily Notes"));
    expect(alternateNotebook).toBeTruthy();
    fireEvent.click(alternateNotebook as HTMLButtonElement);
    expect(screen.queryByRole("heading", { name: "Daily Notes", level: 1 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">open saved search daily scoped" }
    });
    fireEvent.click(screen.getByText("Open saved search: Daily scoped"));

    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
    expect((screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement).value).toBe("agenda");
  });

  it("opens saved search edit dialog from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Daily scoped" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">edit saved search daily scoped" }
    });
    fireEvent.click(screen.getByText("Edit saved search: Daily scoped"));

    expect(screen.getByRole("heading", { name: "Edit saved search", level: 3 })).toBeInTheDocument();
  });

  it("removes a saved search from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Daily scoped" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">remove saved search daily scoped" }
    });
    fireEvent.click(screen.getByText("Remove saved search: Daily scoped"));

    expect(screen.queryByRole("button", { name: /^Daily scoped/i })).not.toBeInTheDocument();
    expect(screen.getByText('Removed saved search "Daily scoped"')).toBeInTheDocument();
  });

  it("persists chip filters when saving and reopening a saved search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Saved search due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has due tasks" }));
    fireEvent.click(screen.getByRole("button", { name: "Upcoming tasks" }));
    fireEvent.click(screen.getByRole("button", { name: "Has reminders" }));
    fireEvent.click(screen.getByRole("button", { name: "Upcoming reminders" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Due focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /^Due focus/i }));
    const dueChip = screen.getByRole("button", { name: "Has due tasks" });
    const upcomingChip = screen.getByRole("button", { name: "Upcoming tasks" });
    const reminderChip = screen.getByRole("button", { name: "Has reminders" });
    const upcomingReminderChip = screen.getByRole("button", { name: "Upcoming reminders" });
    expect(dueChip).toHaveClass("active");
    expect(upcomingChip).toHaveClass("active");
    expect(reminderChip).toHaveClass("active");
    expect(upcomingReminderChip).toHaveClass("active");
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    expect(queryInput.value).toContain("has:due");
    expect(queryInput.value).toContain("has:upcoming");
    expect(queryInput.value).toContain("has:reminder");
    expect(queryInput.value).toContain("has:reminder-upcoming");
  });

  it("applies updated date chips to the quick search query", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(queryInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: "Updated week" }));
    expect(queryInput.value).toContain("updated:week");
    expect(screen.getByRole("button", { name: "Updated week" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Updated today" }));
    expect(queryInput.value).toContain("updated:today");
    expect(queryInput.value).not.toContain("updated:week");
    expect(screen.getByRole("button", { name: "Updated today" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Updated today" }));
    expect(queryInput.value).toBe("agenda");
    expect(screen.getByRole("button", { name: "Updated today" })).not.toHaveClass("active");
  });

  it("applies created date chips to the quick search query", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(queryInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: "Created week" }));
    expect(queryInput.value).toContain("created:week");
    expect(screen.getByRole("button", { name: "Created week" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Created today" }));
    expect(queryInput.value).toContain("created:today");
    expect(queryInput.value).not.toContain("created:week");
    expect(screen.getByRole("button", { name: "Created today" })).toHaveClass("active");

    fireEvent.click(screen.getByRole("button", { name: "Created today" }));
    expect(queryInput.value).toBe("agenda");
    expect(screen.getByRole("button", { name: "Created today" })).not.toHaveClass("active");
  });

  it("clears date preset chips without removing search text", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(queryInput, { target: { value: "journal" } });

    fireEvent.click(screen.getByRole("button", { name: "Updated month" }));
    expect(queryInput.value).toContain("updated:month");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(queryInput.value).toBe("journal");
  });

  it("clears created date preset chips without removing search text", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    fireEvent.change(queryInput, { target: { value: "journal" } });

    fireEvent.click(screen.getByRole("button", { name: "Created month" }));
    expect(queryInput.value).toContain("created:month");

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(queryInput.value).toBe("journal");
  });

  it("removes a single recent search entry from the search modal", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByText("agenda")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove recent search agenda" }));
    expect(screen.queryByText("agenda")).not.toBeInTheDocument();
  });

  it("clears all recent searches from the search modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "journal" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.click(screen.getByRole("button", { name: "Clear recent searches" }));

    expect(screen.getByText("Cleared recent searches")).toBeInTheDocument();
    expect(screen.getByText("No recent searches")).toBeInTheDocument();
    expect(screen.queryByText("agenda")).not.toBeInTheDocument();
    expect(screen.queryByText("journal")).not.toBeInTheDocument();
  });

  it("deduplicates recent searches case-insensitively", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "AGENDA" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const recentButtons = Array.from(document.querySelectorAll<HTMLButtonElement>(".recent-search-open"));
    const agendaEntries = recentButtons.filter((entry) => (entry.textContent ?? "").trim().toLowerCase() === "agenda");
    expect(agendaEntries).toHaveLength(1);
  });

  it("copies note link from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Note link copied")).toBeInTheDocument();
  });

  it("copies note path from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Copy path/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("shares note link from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Share/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText("Share link copied")).toBeInTheDocument();
  });

  it("copies note markdown from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Copy markdown/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("# Agenda");
    expect(screen.getByText("Note markdown copied")).toBeInTheDocument();
  });

  it("copies note html from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Copy HTML/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<h1>Agenda</h1>");
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();
  });

  it("copies note text from quick search footer action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Copy text/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("Priority 1");
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("copies selected search result markdown with shift+cmd+m in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "m", metaKey: true, shiftKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(writeText.mock.calls[0]?.[0]).toContain("# Agenda");
  });

  it("copies selected search result html with shift+cmd+h in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "h", metaKey: true, shiftKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<h1>Agenda</h1>");
  });

  it("copies selected search result text with shift+cmd+t in search modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "t", metaKey: true, shiftKey: true });

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("Priority 1");
  });

  it("opens selected quick search result in new window from footer action", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Open in new window/i }));
    expect(openSpy).toHaveBeenCalledTimes(1);
    openSpy.mockRestore();
  });

  it("opens selected quick search result in lite edit mode from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Open in Lite edit mode/i }));
    expect(screen.getByRole("heading", { name: "Markdown", level: 3 })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("opens selected quick search result in full editor from footer action", () => {
    render(<App />);
    fireEvent.keyDown(window, { key: "o", metaKey: true, altKey: true });
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Open in full editor/i }));
    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens selected quick search result local graph from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    fireEvent.click(screen.getByRole("button", { name: /Open local graph/i }));
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("opens selected quick search result note info from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Note info/i }));
    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("opens selected quick search result note history from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Note history/i }));
    expect(screen.getByRole("heading", { name: /History.*Agenda/i, level: 3 })).toBeInTheDocument();
  });

  it("opens selected quick search result tag editor from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Edit tags/i }));
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
  });

  it("opens selected quick search result rename dialog from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Rename note/i }));
    expect(screen.getByRole("heading", { name: "Rename note", level: 3 })).toBeInTheDocument();
  });

  it("opens selected quick search result find-in-note from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Find in note/i }));
    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens selected quick search result move dialog from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move note/i }));
    expect(screen.getByRole("heading", { name: "Move", level: 3 })).toBeInTheDocument();
  });

  it("opens selected quick search result copy dialog from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Copy to/i }));
    expect(screen.getByRole("heading", { name: "Copy to", level: 3 })).toBeInTheDocument();
  });

  it("toggles selected quick search result template from footer action", async () => {
    render(<App />);
    const templatesButton = screen.getByRole("button", { name: "Templates" });
    const templatesBadgeBefore = templatesButton.querySelector(".sidebar-link-badge")?.textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(
      within(searchActions as HTMLElement).getByRole("button", { name: /^(Set as template|Remove from Templates)/i })
    );
    await waitFor(() => {
      const templatesBadgeAfter = screen.getByRole("button", { name: "Templates" }).querySelector(".sidebar-link-badge")
        ?.textContent;
      expect(templatesBadgeAfter).not.toBe(templatesBadgeBefore);
    });
  });

  it("toggles selected quick search result shortcut from footer action", async () => {
    render(<App />);
    const shortcutsButton = screen.getByRole("button", { name: "Shortcuts" });
    const shortcutsBadgeBefore = shortcutsButton.querySelector(".sidebar-link-badge")?.textContent ?? "";

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(
      within(searchActions as HTMLElement).getByRole("button", { name: /^(Add to shortcuts|Remove from shortcuts)/i })
    );
    await waitFor(() => {
      const shortcutsBadgeAfter = screen.getByRole("button", { name: "Shortcuts" }).querySelector(".sidebar-link-badge")
        ?.textContent;
      expect(shortcutsBadgeAfter).not.toBe(shortcutsBadgeBefore);
    });
  });

  it("toggles selected quick search result home pin from footer action", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from home Agenda"));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^(Pin to Home|Unpin from Home)/i }));
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from home Agenda"))).toBe(!wasPinned);
    });
  });

  it("toggles selected quick search result notebook pin from footer action", async () => {
    render(<App />);
    const wasPinned = Boolean(screen.queryByLabelText("Unpin from notebook Agenda"));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(
      within(searchActions as HTMLElement).getByRole("button", { name: /^(Pin to notebook|Unpin from notebook)/i })
    );
    await waitFor(() => {
      expect(Boolean(screen.queryByLabelText("Unpin from notebook Agenda"))).toBe(!wasPinned);
    });
  });

  it("exports selected quick search result markdown from footer action", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Export as Markdown/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected quick search result HTML from footer action", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Export as HTML/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported HTML "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected quick search result text from footer action", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Export as Text/i }));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported text "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports selected quick search result PDF from footer action", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Export as PDF/i }));

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(screen.getByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();
  });

  it("prints selected quick search result from footer action", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Print/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("opens selected quick search result tasks from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Open tasks/i }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens selected quick search result files from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Open files/i }));
    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("No attachments found")).toBeInTheDocument();
  });

  it("opens selected quick search result calendar from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Open calendar/i }));
    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens selected quick search result reminders from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Open reminders/i }));
    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("duplicates selected quick search result from footer action", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Duplicate note/i }));
    expect(await screen.findByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("moves selected quick search result to trash from footer action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();
  });

  it("restores selected quick search result from footer action when browsing trash", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    let searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Restore/i }));

    expect(screen.getByText('"Agenda" restored from Trash')).toBeInTheDocument();
  });

  it("deletes selected quick search result permanently from footer action when browsing trash", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    let searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Delete permanently/i }));

    expect(screen.getByText('"Agenda" deleted permanently')).toBeInTheDocument();
  });

  it("searches trashed notes from quick actions while in trash mode", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    let searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });

    const searchModal = searchInput.closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("blocks duplicate quick-search action for trashed notes", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    let searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Duplicate note/i }));

    expect(screen.getByText("Restore notes from Trash to use this action")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Agenda copy", level: 2 })).not.toBeInTheDocument();
  });

  it("blocks shortcut quick-search toggle for trashed notes", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    let searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(within(searchActions as HTMLElement).getByRole("button", { name: /^Move to Trash/i }));
    expect(screen.getByText('"Agenda" moved to Trash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    searchActions = document.querySelector(".search-actions") as HTMLElement | null;
    expect(searchActions).toBeTruthy();
    fireEvent.click(
      within(searchActions as HTMLElement).getByRole("button", { name: /^(Add to shortcuts|Remove from shortcuts)/i })
    );

    expect(screen.getByText("Restore notes from Trash to use this action")).toBeInTheDocument();
  });

  it("clears recent searches from command palette action", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: "agenda" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear recent searches" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(screen.getByText("Cleared recent searches")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    expect(screen.getByText("No recent searches")).toBeInTheDocument();
  });

  it("shows guard toast when clearing recent searches from command palette with none saved", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear recent searches" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(screen.getByText("Recent searches are already empty")).toBeInTheDocument();
  });

  it("supports has:due search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Due filter task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:due" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports has:upcoming search filter for due tasks", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Upcoming filter task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:upcoming" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("sets a note reminder from metadata and shows it on home", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    expect(screen.getAllByText("Upcoming 2099-01-01").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    const reminderHeading = screen.getByRole("heading", { name: "Reminders", level: 2 });
    expect(reminderHeading).toBeInTheDocument();
    const reminderCard = reminderHeading.closest("section");
    expect(reminderCard).toBeTruthy();
    expect(within(reminderCard as HTMLElement).getByText("Upcoming 2099-01-01")).toBeInTheDocument();
  });

  it("supports has:reminder search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:reminder" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports has:reminder-overdue search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:reminder-overdue" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports has:reminder-upcoming search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:reminder-upcoming" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports has:link search filter", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Agenda]]" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:link" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Link Source")).toBeInTheDocument();
  });

  it("supports has:backlink search filter", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Backlink Target\n\nReference me" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Backlink Source\n\n[[Backlink Target]]" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "has:backlink" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Backlink Target")).toBeInTheDocument();
  });

  it("supports updated:today search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "updated:today" }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Untitled")).toBeInTheDocument();
  });

  it("supports created date range search filter", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: `created:${today}..${today}` }
    });

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Untitled")).toBeInTheDocument();
  });

  it("supports due-task chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Chip due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has due tasks" }));

    const dueChip = screen.getByRole("button", { name: "Has due tasks" });
    expect(dueChip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports overdue task chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Overdue task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2000-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Overdue tasks" }));

    const chip = screen.getByRole("button", { name: "Overdue tasks" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports due today chip filter in search", () => {
    render(<App />);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Today task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: today } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Due today" }));

    const chip = screen.getByRole("button", { name: "Due today" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports undated task chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Undated task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Undated tasks" }));

    const chip = screen.getByRole("button", { name: "Undated tasks" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports reminder chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has reminders" }));

    const reminderChip = screen.getByRole("button", { name: "Has reminders" });
    expect(reminderChip).toHaveClass("active");

    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports overdue reminder chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2000-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Overdue reminders" }));

    const chip = screen.getByRole("button", { name: "Overdue reminders" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports upcoming reminder chip filter in search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Upcoming reminders" }));

    const chip = screen.getByRole("button", { name: "Upcoming reminders" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports links chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Agenda]]" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has links" }));

    const chip = screen.getByRole("button", { name: "Has links" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Link Source")).toBeInTheDocument();
  });

  it("supports backlinks chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Backlink Target\n\nReference me" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Backlink Source\n\n[[Backlink Target]]" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has backlinks" }));

    const chip = screen.getByRole("button", { name: "Has backlinks" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Backlink Target")).toBeInTheDocument();
  });

  it("supports tags chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Tagged Note\n\n#project #planning" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has tags" }));

    const chip = screen.getByRole("button", { name: "Has tags" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Tagged Note")).toBeInTheDocument();
  });

  it("supports image attachment chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n![image](./attachments/photo.png)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has images" }));

    const chip = screen.getByRole("button", { name: "Has images" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports pdf attachment chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[file](./attachments/brief.pdf)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has PDFs" }));

    const chip = screen.getByRole("button", { name: "Has PDFs" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports video attachment chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[clip](./attachments/demo.mp4)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has videos" }));

    const chip = screen.getByRole("button", { name: "Has videos" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("supports audio attachment chip filter in search", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[voice memo](./attachments/note.m4a)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has audio" }));

    const chip = screen.getByRole("button", { name: "Has audio" });
    expect(chip).toHaveClass("active");
    const searchModal = screen.getByPlaceholderText("Search or ask a question").closest("section");
    expect(searchModal).toBeTruthy();
    expect(within(searchModal as HTMLElement).getByText("Agenda")).toBeInTheDocument();
  });

  it("filters files modal by attachment type and text query", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: {
        value:
          "# Agenda\n\n![Photo shot](./attachments/photo.png)\n[Doc PDF](./attachments/brief.pdf)\n[Voice memo](./attachments/audio.m4a)\n[Archive](./attachments/files.zip)"
      }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });
    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.getByText("Doc PDF")).toBeInTheDocument();
    expect(screen.getByText("Voice memo")).toBeInTheDocument();
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.getAllByText("Agenda · Daily Notes").length).toBeGreaterThan(0);
    const filesModal = screen.getByRole("heading", { name: "Files", level: 3 }).closest("section");
    expect(filesModal).toBeTruthy();
    const rowsBefore = Array.from((filesModal as HTMLElement).querySelectorAll<HTMLElement>("li strong"));
    expect(rowsBefore[0]?.textContent).toBe("Photo shot");
    fireEvent.click(within(filesModal as HTMLElement).getByRole("button", { name: "Name A-Z" }));
    const rowsAsc = Array.from((filesModal as HTMLElement).querySelectorAll<HTMLElement>("li strong"));
    expect(rowsAsc[0]?.textContent).toBe("Archive");
    fireEvent.click(within(filesModal as HTMLElement).getByRole("button", { name: "Name Z-A" }));
    const rowsDesc = Array.from((filesModal as HTMLElement).querySelectorAll<HTMLElement>("li strong"));
    expect(rowsDesc[0]?.textContent).toBe("Voice memo");
    fireEvent.click(within(filesModal as HTMLElement).getByRole("button", { name: "Recent" }));

    fireEvent.click(screen.getByRole("button", { name: /^Images \(/ }));
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
    expect(screen.queryByText("Voice memo")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Other \(/ }));
    expect(screen.getByText("Archive")).toBeInTheDocument();
    expect(screen.queryByText("Photo shot")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^All \(/ }));
    fireEvent.change(screen.getByLabelText("Filter files"), { target: { value: "voice" } });
    expect(screen.getByText("Voice memo")).toBeInTheDocument();
    expect(screen.queryByText("Photo shot")).not.toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
  });

  it("filters files modal to attachments from the current note", () => {
    render(<App />);

    let editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Capture\n\n![Photo shot](./attachments/photo.png)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    expect(screen.getByText("Doc PDF")).toBeInTheDocument();
    expect(screen.getByText("Photo shot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Current note \(/ }));
    expect(screen.getByText("Photo shot")).toBeInTheDocument();
    expect(screen.queryByText("Doc PDF")).not.toBeInTheDocument();
  });

  it("copies attachment path from files modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Copy path for Doc PDF" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("./attachments/brief.pdf"));
    expect(screen.getByText("Attachment path copied")).toBeInTheDocument();
  });

  it("copies attachment markdown from files modal", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n![Photo shot](./attachments/photo.png)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Copy markdown for Photo shot" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("![Photo shot](./attachments/photo.png)"));
    expect(screen.getByText("Attachment markdown copied")).toBeInTheDocument();
  });

  it("inserts attachment link from files modal into current note", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Insert link for Doc PDF" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("[Doc PDF](./attachments/brief.pdf)");
    expect(screen.getByText("Attachment link inserted")).toBeInTheDocument();
  });

  it("inserts attachment embed syntax from files modal", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n![Photo shot](./attachments/photo.png)" }
    });
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open files" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Insert embed for Photo shot" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("![Photo shot](./attachments/photo.png)");
    expect(screen.getByText("Attachment embed inserted")).toBeInTheDocument();
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
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Link to note" }));

    expect(screen.getByRole("heading", { name: "Link to note", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Note title"), { target: { value: "Roadmap Hub" } });
    fireEvent.click(screen.getByRole("button", { name: "Insert link" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("[[Roadmap Hub]]");
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });


  it("opens toolbar link action in modal without prompt", () => {
    const promptSpy = vi.spyOn(window, "prompt");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Rich" }));

    const toolbarLink = Array.from(document.querySelectorAll(".editor-toolbar button")).find(
      (button) => button.textContent?.trim() === "Link"
    ) as HTMLButtonElement | undefined;
    expect(toolbarLink).toBeTruthy();
    fireEvent.click(toolbarLink as HTMLButtonElement);

    expect(screen.getByRole("heading", { name: "Insert link", level: 3 })).toBeInTheDocument();
    const linkModal = screen.getByRole("heading", { name: "Insert link", level: 3 }).closest("section");
    expect(linkModal).toBeTruthy();
    fireEvent.change(within(linkModal as HTMLElement).getByLabelText("URL"), {
      target: { value: "https://example.com" }
    });
    fireEvent.click(within(linkModal as HTMLElement).getByRole("button", { name: "Insert link" }));

    expect(screen.queryByRole("heading", { name: "Insert link", level: 3 })).not.toBeInTheDocument();
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("inserts media from markdown slash menu via modal", () => {
    const promptSpy = vi.spyOn(window, "prompt");
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const slashCommand = `${editor?.value ?? ""}
/image`;
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: slashCommand, selectionStart: slashCommand.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Image" }));

    expect(screen.getByRole("heading", { name: "Insert image", level: 3 })).toBeInTheDocument();
    const imageModal = screen.getByRole("heading", { name: "Insert image", level: 3 }).closest("section");
    expect(imageModal).toBeTruthy();
    fireEvent.change(within(imageModal as HTMLElement).getByLabelText("Image URL or path"), {
      target: { value: "./attachments/test.png" }
    });
    fireEvent.click(within(imageModal as HTMLElement).getByRole("button", { name: "Insert" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("![image](./attachments/test.png)");
    expect(promptSpy).not.toHaveBeenCalled();
    promptSpy.mockRestore();
  });

  it("inserts sketch media from markdown slash menu via modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const slashCommand = `${editor?.value ?? ""}\n/sketch`;
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: slashCommand, selectionStart: slashCommand.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Sketch" }));

    expect(screen.getByRole("heading", { name: "Insert sketch", level: 3 })).toBeInTheDocument();
    const sketchModal = screen.getByRole("heading", { name: "Insert sketch", level: 3 }).closest("section");
    expect(sketchModal).toBeTruthy();
    fireEvent.change(within(sketchModal as HTMLElement).getByLabelText("Sketch URL or path"), {
      target: { value: "./attachments/whiteboard.png" }
    });
    fireEvent.click(within(sketchModal as HTMLElement).getByRole("button", { name: "Insert" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("![sketch](./attachments/whiteboard.png)");
  });

  it("inserts google drive link from markdown slash menu", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const slashCommand = `${editor?.value ?? ""}\n/google`;
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: slashCommand, selectionStart: slashCommand.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Google Drive" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("[Google Drive](https://drive.google.com/)");
  });

  it("inserts a markdown table from rich insert menu", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Rich" }));
    fireEvent.click(screen.getByRole("button", { name: "Insert" }));

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Table" }));

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    await waitFor(() => {
      const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
      expect(editor?.value).toContain("|");
      expect(editor?.value).toContain("| --- | --- |");
    });
  });

  it("applies align-center from markdown slash menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const slashCommand = `${editor?.value ?? ""}\n/align`;
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: slashCommand, selectionStart: slashCommand.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Align center" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain('<div align="center">aligned text</div>');
  });

  it("normalizes HTML paste into markdown in markdown editor", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const clipboardData = {
      files: [],
      getData: (type: string) => {
        if (type === "text/html") {
          return "<h2>Agenda</h2><p>Visit <a href=\"https://example.com\">Example</a></p><script>alert(1)</script>";
        }
        if (type === "text/plain") {
          return "Agenda\nVisit Example";
        }
        return "";
      }
    } as unknown as DataTransfer;

    fireEvent.paste(editor as HTMLTextAreaElement, { clipboardData });

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("## Agenda");
    expect(updatedEditor?.value).toContain("[Example](https://example.com)");
    expect(updatedEditor?.value).not.toContain("alert(1)");
  });

  it("normalizes HTML paste in rich editor and keeps sanitized markdown output", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "Rich" }));

    const richPane = screen.getByLabelText("Rich editor");
    const clipboardData = {
      files: [],
      getData: (type: string) => {
        if (type === "text/html") {
          return "<h2>Agenda</h2><p>Visit <a href=\"https://example.com\">Example</a></p><script>alert(1)</script>";
        }
        if (type === "text/plain") {
          return "Agenda\nVisit Example";
        }
        return "";
      }
    } as unknown as DataTransfer;

    fireEvent.paste(richPane, { clipboardData });
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    await waitFor(() => {
      const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
      expect(editor?.value).toContain("## Agenda");
      expect(editor?.value).toContain("[Example](https://example.com)");
      expect(editor?.value).not.toContain("alert(1)");
    });
  });


  it("generates table of contents links from markdown headings", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    const source = "# Project Plan\n\n## Milestones\n\n### Phase 1\n\n/table";
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: source, selectionStart: source.length }
    });

    const slashMenu = document.querySelector(".slash-menu") as HTMLElement | null;
    expect(slashMenu).toBeTruthy();
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("option", { name: "Table of contents" }));

    const updatedEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(updatedEditor?.value).toContain("## Table of contents");
    expect(updatedEditor?.value).toContain("- [Project Plan](#project-plan)");
    expect(updatedEditor?.value).toContain("  - [Milestones](#milestones)");
    expect(updatedEditor?.value).toContain("    - [Phase 1](#phase-1)");
  });

  it("opens template picker from sidebar action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "New from template" }));
    expect(screen.getByRole("heading", { name: "New from template", level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/Variables:/i)).toBeInTheDocument();
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

  it("allocates unique paths when creating untitled notes", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    fireEvent.click(screen.getByRole("button", { name: "Info" }));

    const readPath = (): string => {
      const metadataPanel = screen.getByRole("heading", { name: "Note metadata", level: 4 }).closest("aside");
      expect(metadataPanel).toBeTruthy();
      const pathRow = Array.from((metadataPanel as HTMLElement).querySelectorAll("div")).find(
        (entry) => entry.querySelector("dt")?.textContent?.trim() === "Path"
      );
      const value = pathRow?.querySelector("dd")?.textContent?.trim();
      expect(value).toBeTruthy();
      return value as string;
    };

    const firstPath = readPath();
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const secondPath = readPath();

    expect(firstPath).toMatch(/untitled\.md$/);
    expect(secondPath).toMatch(/untitled-2\.md$/);
    expect(secondPath).not.toBe(firstPath);
  });

  it("expands template variables when creating a note", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: {
        value:
          "# Agenda\n\nDate {{date}}\nTime {{time}}\nWhen {{datetime}}\nStamp {{timestamp}}\nYear {{year}}\nMonth {{month}}\nDay {{day}}\nWeekday {{weekday}}\nTitle {{title}}\nNotebook {{notebook}}"
      }
    });

    fireEvent.click(screen.getByRole("button", { name: "Use this template" }));
    fireEvent.change(screen.getByPlaceholderText("New note title"), { target: { value: "Template Vars Note" } });
    fireEvent.click(screen.getByRole("button", { name: "Create note" }));

    expect(await screen.findByRole("heading", { name: "Template Vars Note", level: 2 })).toBeInTheDocument();
    const resultEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(resultEditor?.value).toContain("Title Template Vars Note");
    expect(resultEditor?.value).not.toContain("{{date}}");
    expect(resultEditor?.value).not.toContain("{{time}}");
    expect(resultEditor?.value).not.toContain("{{datetime}}");
    expect(resultEditor?.value).not.toContain("{{timestamp}}");
    expect(resultEditor?.value).not.toContain("{{year}}");
    expect(resultEditor?.value).not.toContain("{{month}}");
    expect(resultEditor?.value).not.toContain("{{day}}");
    expect(resultEditor?.value).not.toContain("{{weekday}}");
    expect(resultEditor?.value).not.toContain("{{title}}");
    expect(resultEditor?.value).not.toContain("{{notebook}}");
    expect(resultEditor?.value).toMatch(/Year \d{4}/);
    expect(resultEditor?.value).toMatch(/Month \d{2}/);
    expect(resultEditor?.value).toMatch(/Day \d{2}/);
    expect(resultEditor?.value).toMatch(/Weekday [A-Za-z]+/);
    expect(resultEditor?.value).toContain("Notebook Daily Notes");
  });

  it("creates a task from the task dialog", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByRole("heading", { name: "New task", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Quick task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    const taskTitles = Array.from((tasksModal as HTMLElement).querySelectorAll<HTMLElement>(".task-row strong"));
    expect(taskTitles.some((title) => title.textContent === "Quick task")).toBe(true);
  });

  it("applies due date presets in the task dialog", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Preset task" } });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowLabel = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(
      tomorrow.getDate()
    ).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Tomorrow" }));
    const dueInput = screen.getByLabelText("Due date (optional)") as HTMLInputElement;
    expect(dueInput.value).toBe(tomorrowLabel);
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText(/Preset task/)).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText(new RegExp(`Due ${tomorrowLabel}`))).toBeInTheDocument();
  });

  it("creates a task with due date metadata and surfaces due label", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Future task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText("Future task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText(/Due 2099-01-01/)).toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByText("Future task"));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor?.value).toContain("- [ ] Future task due:2099-01-01");
  });

  it("filters tasks by due status in tasks modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Due-only task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "No-due task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText("Due-only task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText("No-due task")).toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: /No due/i }));
    expect(within(tasksModal as HTMLElement).queryByText("Due-only task")).not.toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText("No-due task")).toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: /Upcoming/i }));
    expect(within(tasksModal as HTMLElement).getByText("Due-only task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).queryByText("No-due task")).not.toBeInTheDocument();
  });

  it("filters tasks by query in tasks modal and resets on reopen", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Forecast roadmap" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Grocery pickup" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    fireEvent.change(within(tasksModal as HTMLElement).getByLabelText("Filter tasks"), {
      target: { value: "grocery" }
    });
    expect(within(tasksModal as HTMLElement).getByText("Grocery pickup")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).queryByText("Forecast roadmap")).not.toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    const reopenedModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(reopenedModal).toBeTruthy();
    const queryInput = within(reopenedModal as HTMLElement).getByLabelText("Filter tasks") as HTMLInputElement;
    expect(queryInput.value).toBe("");
    expect(within(reopenedModal as HTMLElement).getByText("Grocery pickup")).toBeInTheDocument();
    expect(within(reopenedModal as HTMLElement).getByText("Forecast roadmap")).toBeInTheDocument();
  });

  it("sorts tasks by due date in tasks modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Later due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Soon due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2000-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: "Due soonest" }));
    let taskRows = Array.from((tasksModal as HTMLElement).querySelectorAll<HTMLElement>(".task-row strong"));
    expect(taskRows[0]?.textContent).toBe("Soon due task");

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: "Due latest" }));
    taskRows = Array.from((tasksModal as HTMLElement).querySelectorAll<HTMLElement>(".task-row strong"));
    expect(taskRows[0]?.textContent).toBe("Later due task");
  });

  it("completes only shown tasks from tasks modal filter", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Batch due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Batch no-due task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    const tasksModal = screen.getByRole("heading", { name: "Tasks", level: 3 }).closest("section");
    expect(tasksModal).toBeTruthy();
    expect(within(tasksModal as HTMLElement).getByText("Batch due task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText("Batch no-due task")).toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: /Upcoming/i }));
    expect(within(tasksModal as HTMLElement).getByText("Batch due task")).toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).queryByText("Batch no-due task")).not.toBeInTheDocument();

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: "Complete shown" }));
    await waitFor(() => {
      expect(within(tasksModal as HTMLElement).getByText("No tasks in this filter")).toBeInTheDocument();
    });

    fireEvent.click(within(tasksModal as HTMLElement).getByRole("button", { name: /All \(/i }));
    expect(within(tasksModal as HTMLElement).queryByText("Batch due task")).not.toBeInTheDocument();
    expect(within(tasksModal as HTMLElement).getByText("Batch no-due task")).toBeInTheDocument();
  });

  it("copies task markdown from tasks modal row action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Batch due task" } });
    fireEvent.change(screen.getByLabelText("Due date (optional)"), { target: { value: "2099-01-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy markdown for task Batch due task" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("- [ ] Batch due task due:2099-01-01"));
    expect(screen.getByText("Task markdown copied")).toBeInTheDocument();
  });

  it("filters calendar events by query and resets on reopen", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    let searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    let calendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(calendarModal).toBeTruthy();
    expect(within(calendarModal as HTMLElement).getByText("Weekly planning")).toBeInTheDocument();
    expect(within(calendarModal as HTMLElement).getByText("Research block")).toBeInTheDocument();
    const eventRows = Array.from((calendarModal as HTMLElement).querySelectorAll<HTMLElement>(".calendar-row strong"));
    expect(eventRows[0]?.textContent).toBe("Weekly planning");
    fireEvent.click(within(calendarModal as HTMLElement).getByRole("button", { name: "Latest" }));
    const latestRows = Array.from((calendarModal as HTMLElement).querySelectorAll<HTMLElement>(".calendar-row strong"));
    expect(latestRows[0]?.textContent).toBe("Template review");
    fireEvent.click(within(calendarModal as HTMLElement).getByRole("button", { name: "Soonest" }));
    fireEvent.click(within(calendarModal as HTMLElement).getByRole("button", { name: /^Deep Work \(/ }));
    expect(within(calendarModal as HTMLElement).getByText("Research block")).toBeInTheDocument();
    expect(within(calendarModal as HTMLElement).queryByText("Weekly planning")).not.toBeInTheDocument();
    fireEvent.click(within(calendarModal as HTMLElement).getByRole("button", { name: /^All \(/ }));

    fireEvent.change(within(calendarModal as HTMLElement).getByLabelText("Filter events"), {
      target: { value: "research" }
    });
    expect(within(calendarModal as HTMLElement).getByText("Research block")).toBeInTheDocument();
    expect(within(calendarModal as HTMLElement).queryByText("Weekly planning")).not.toBeInTheDocument();

    fireEvent.click(within(calendarModal as HTMLElement).getByRole("button", { name: "Close" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    calendarModal = screen.getByRole("heading", { name: "Calendar", level: 3 }).closest("section");
    expect(calendarModal).toBeTruthy();
    const queryInput = within(calendarModal as HTMLElement).getByLabelText("Filter events") as HTMLInputElement;
    expect(queryInput.value).toBe("");
    expect(within(calendarModal as HTMLElement).getByRole("button", { name: /^All \(/ })).toHaveClass("active");
  });

  it("inserts an event reference from calendar modal into the active note", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Insert event reference for Weekly planning" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("Calendar event: [[event:");
    expect(editor?.value).toContain("|Weekly planning]]");
    expect(screen.getByText("Event reference inserted")).toBeInTheDocument();
  });

  it("shows linked event metadata in preview panel", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Insert event reference for Weekly planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const linkedEventsSection = within(previewPane).getByRole("heading", { name: "Linked events", level: 5 }).closest("section");
    expect(linkedEventsSection).toBeTruthy();
    expect(
      within(linkedEventsSection as HTMLElement).getByRole("button", { name: "Open preview event Weekly planning" })
    ).toBeInTheDocument();
    expect(within(linkedEventsSection as HTMLElement).getByText(/^Events · /i)).toBeInTheDocument();
  });

  it("opens preview linked event in the event editor", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Insert event reference for Weekly planning" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const linkedEventsSection = within(previewPane).getByRole("heading", { name: "Linked events", level: 5 }).closest("section");
    expect(linkedEventsSection).toBeTruthy();

    fireEvent.click(
      within(linkedEventsSection as HTMLElement).getByRole("button", { name: "Open preview event Weekly planning" })
    );

    expect(screen.getByRole("heading", { name: "Edit event", level: 3 })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Weekly planning")).toBeInTheDocument();
  });

  it("shows note metadata in preview panel", () => {
    render(<App />);

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const metadataSection = within(previewPane).getByRole("heading", { name: "Metadata", level: 5 }).closest("section");
    expect(metadataSection).toBeTruthy();
    expect(within(metadataSection as HTMLElement).getByText("Notebook")).toBeInTheDocument();
    expect(within(metadataSection as HTMLElement).getByText("Path")).toBeInTheDocument();
    expect(within(metadataSection as HTMLElement).getByText("Daily Notes")).toBeInTheDocument();
    expect(within(metadataSection as HTMLElement).getByText("Daily Notes/Agenda.md")).toBeInTheDocument();
  });

  it("opens the notebook from preview metadata", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const metadataSection = within(previewPane).getByRole("heading", { name: "Metadata", level: 5 }).closest("section");
    expect(metadataSection).toBeTruthy();

    fireEvent.click(within(metadataSection as HTMLElement).getByRole("button", { name: "Open preview notebook Daily Notes" }));
    expect(screen.getByRole("heading", { name: "Daily Notes", level: 1 })).toBeInTheDocument();
  });

  it("opens a tag filter from preview metadata tags", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(screen.getByRole("heading", { name: "Home", level: 1 })).toBeInTheDocument();

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const metadataSection = within(previewPane).getByRole("heading", { name: "Metadata", level: 5 }).closest("section");
    expect(metadataSection).toBeTruthy();

    fireEvent.click(within(metadataSection as HTMLElement).getByRole("button", { name: "Filter preview tag focus" }));
    expect(screen.getByRole("heading", { name: "All Notes", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "#focus ×" })).toBeInTheDocument();
  });

  it("copies the note path from preview metadata", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const metadataSection = within(previewPane).getByRole("heading", { name: "Metadata", level: 5 }).closest("section");
    expect(metadataSection).toBeTruthy();

    fireEvent.click(within(metadataSection as HTMLElement).getByRole("button", { name: "Copy preview path Daily Notes/Agenda.md" }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Daily Notes/Agenda.md"));
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("prevents duplicate event references from calendar modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    const insertButton = screen.getByRole("button", { name: "Insert event reference for Weekly planning" });
    fireEvent.click(insertButton);
    fireEvent.click(insertButton);

    expect(screen.getByText("Event is already linked in this note")).toBeInTheDocument();
  });

  it("copies an event reference from calendar modal row action", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: "Copy event reference for Weekly planning" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledTimes(1);
    });
    const copied = String(writeText.mock.calls[0][0] ?? "");
    expect(copied).toContain("[[event:");
    expect(copied).toContain("|Weekly planning]]");
    expect(screen.getByText("Event reference copied")).toBeInTheDocument();
  });

  it("links and unlinks a calendar event to the active note from calendar modal", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">open calendar" } });
    fireEvent.keyDown(searchInput, { key: "Enter" });

    const row = screen.getByText("Weekly planning").closest(".calendar-row");
    expect(row).toBeTruthy();

    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Link active note for Weekly planning" }));
    expect(within(row as HTMLElement).getByRole("button", { name: "Open note" })).toBeInTheDocument();
    expect(screen.getByText('Linked "Weekly planning" to "Agenda"')).toBeInTheDocument();

    fireEvent.click(within(row as HTMLElement).getByRole("button", { name: "Unlink event for Weekly planning" }));
    expect(within(row as HTMLElement).queryByRole("button", { name: "Open note" })).not.toBeInTheDocument();
    expect(screen.getByText('Unlinked "Weekly planning" from "Agenda"')).toBeInTheDocument();
  });

  it("derives note title from first markdown line when no heading exists", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "- [ ] Draft follow-up items\n\ndetails" }
    });

    expect(screen.getByRole("heading", { name: "Draft follow-up items", level: 2 })).toBeInTheDocument();
  });

  it("shows unsaved markdown checklist items in tasks view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Draft Task Note\n\n- [ ] Unsaved task from draft" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Tasks" }));
    const taskTitles = Array.from(document.querySelectorAll<HTMLElement>(".task-row strong"));
    expect(taskTitles.some((title) => title.textContent === "Unsaved task from draft")).toBe(true);
  });

  it("toggles backlinks dock in notes view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    expect(screen.getByRole("heading", { name: "Backlinks", level: 2 })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Backlinks" }));
    expect(screen.queryByRole("heading", { name: "Backlinks", level: 2 })).not.toBeInTheDocument();
  });

  it("updates backlinks from unsaved active note title edits", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const sourceEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(sourceEditor).toBeTruthy();
    fireEvent.change(sourceEditor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Focus Board]]" }
    });

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    const targetEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(targetEditor).toBeTruthy();
    fireEvent.change(targetEditor as HTMLTextAreaElement, {
      target: { value: "# Focus Board\n\nUnsaved title change" }
    });

    const backlinksDock = screen.getByLabelText("Backlinks dock");
    expect(within(backlinksDock).getByText(/Notes linking to "Focus Board"/i)).toBeInTheDocument();
    expect(within(backlinksDock).getByRole("button", { name: /Link Source/i })).toBeInTheDocument();
  });

  it("matches backlinks for aliased and anchored wikilinks", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const sourceEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(sourceEditor).toBeTruthy();
    fireEvent.change(sourceEditor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Agenda|Today Plan]]\n[[Agenda#Appointments]]\n[[event:abc123|Standup]]" }
    });

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    const backlinksDock = screen.getByLabelText("Backlinks dock");
    expect(within(backlinksDock).getByRole("button", { name: /Link Source/i })).toBeInTheDocument();
  });

  it("shows backlink context snippets in backlinks dock", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const sourceEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(sourceEditor).toBeTruthy();
    fireEvent.change(sourceEditor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n- [ ] Review [[Agenda]] before standup" }
    });

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    const backlinksDock = screen.getByLabelText("Backlinks dock");
    expect(within(backlinksDock).getByRole("button", { name: /Link Source/i })).toBeInTheDocument();
    expect(within(backlinksDock).getByText(/Review Agenda before standup/i)).toBeInTheDocument();
  });

  it("shows backlink context snippets in preview link section", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const sourceEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(sourceEditor).toBeTruthy();
    fireEvent.change(sourceEditor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n- [ ] Review [[Agenda]] before standup" }
    });

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    expect(within(previewPane).getByText(/Review Agenda before standup/i)).toBeInTheDocument();
  });

  it("opens a preview backlink target note", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "+ Note" }));
    const sourceEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(sourceEditor).toBeTruthy();
    fireEvent.change(sourceEditor as HTMLTextAreaElement, {
      target: { value: "# Link Source\n\n[[Agenda]]" }
    });

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.click(agendaCard as HTMLButtonElement);

    const previewPane = screen.getByRole("region", { name: "Rendered preview" });
    const backlinksSection = within(previewPane).getByRole("heading", { name: "Backlinks", level: 5 }).closest("section");
    expect(backlinksSection).toBeTruthy();

    fireEvent.click(within(backlinksSection as HTMLElement).getByRole("button", { name: "Open preview backlink Link Source" }));
    expect(screen.getByRole("heading", { name: "Link Source", level: 2 })).toBeInTheDocument();
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

  it("opens a note in full editor from context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open in Lite edit mode/i }));
    expect(screen.getByRole("button", { name: "Lite" })).toHaveClass("active");

    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open in full editor/i }));
    expect(screen.getByRole("button", { name: "Lite" })).not.toHaveClass("active");
    expect(screen.getByRole("heading", { name: "Preview", level: 3 })).toBeInTheDocument();
  });

  it("opens local graph scope from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Open local graph/i }));

    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Local" })).toHaveClass("active");
  });

  it("copies a note to another notebook from note context menu", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Copy to/i }));

    const moveModal = screen.getByRole("heading", { name: "Copy to", level: 3 }).closest("section");
    expect(moveModal).toBeTruthy();
    fireEvent.click(within(moveModal as HTMLElement).getByRole("button", { name: "Clippings" }));
    fireEvent.click(within(moveModal as HTMLElement).getByRole("button", { name: "Done" }));

    await waitFor(() => {
      expect(screen.getByText('"Agenda copy" copied to Clippings')).toBeInTheDocument();
    });

    const notebookItems = Array.from(document.querySelectorAll<HTMLButtonElement>(".notebook-item"));
    const clippingsNotebook = notebookItems.find((entry) => entry.textContent?.includes("Clippings"));
    expect(clippingsNotebook).toBeTruthy();
    fireEvent.click(clippingsNotebook as HTMLButtonElement);

    expect(screen.getByRole("heading", { name: "Clippings", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agenda copy", level: 2 })).toBeInTheDocument();
  });

  it("exports a note as PDF via desktop shell from note context menu", async () => {
    const exportNotePdf = vi.fn().mockResolvedValue({ ok: true, path: "/tmp/Agenda.pdf" });
    (window as unknown as { pkmShell?: { exportNotePdf: typeof exportNotePdf } }).pkmShell = { exportNotePdf };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Export as PDF/i }));

    await waitFor(() => expect(exportNotePdf).toHaveBeenCalledTimes(1));
    expect(exportNotePdf.mock.calls[0]?.[0]).toMatchObject({ title: "Agenda" });
    expect(String(exportNotePdf.mock.calls[0]?.[0]?.html ?? "")).toContain("<!doctype html>");
    expect(screen.getByText("Exported PDF to /tmp/Agenda.pdf")).toBeInTheDocument();
  });

  it("exports a note as HTML from note context menu", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-html");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Export as HTML/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported HTML "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("exports a note as text from note context menu", () => {
    const createObjectURL = vi.fn(() => "blob:pkm-note-text");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { value: createObjectURL, configurable: true });
    Object.defineProperty(URL, "revokeObjectURL", { value: revokeObjectURL, configurable: true });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Export as Text/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Exported text "Agenda"')).toBeInTheDocument();
    clickSpy.mockRestore();
  });

  it("falls back to print when exporting note as PDF without desktop shell bridge", () => {
    const printSpy = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /^Export as PDF/i }));

    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it("copies markdown for multi-selected notes from note context menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    const todoCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    expect(todoCard).toBeTruthy();

    fireEvent.click(agendaCard as HTMLButtonElement);
    fireEvent.click(todoCard as HTMLButtonElement, { metaKey: true });
    fireEvent.contextMenu(todoCard as HTMLButtonElement);
    const contextMenu = document.querySelector(".context-menu");
    expect(contextMenu).toBeTruthy();
    fireEvent.click(within(contextMenu as HTMLElement).getByRole("button", { name: /Copy markdown/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const payload = String(writeText.mock.calls[0]?.[0] ?? "");
    expect(payload).toContain("# Agenda");
    expect(payload).toContain("# To-do list");
    expect(payload.indexOf("# To-do list")).toBeLessThan(payload.indexOf("# Agenda"));
    expect(screen.getByText("Markdown copied for 2 notes")).toBeInTheDocument();
  });

  it("copies note path from note context menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Copy path/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toMatch(/agenda/i);
    expect(screen.getByText("Note path copied")).toBeInTheDocument();
  });

  it("copies note html from note context menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Copy HTML/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("<h1>Agenda</h1>");
    expect(screen.getByText("Note HTML copied")).toBeInTheDocument();
  });

  it("copies note text from note context menu", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Copy text/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(String(writeText.mock.calls[0]?.[0] ?? "")).toContain("Priority 1");
    expect(screen.getByText("Note text copied")).toBeInTheDocument();
  });

  it("targets the right-clicked note first when context menu opens on multi-select", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    const todoCard = screen.getAllByText("To-do list")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    expect(todoCard).toBeTruthy();

    fireEvent.click(agendaCard as HTMLButtonElement);
    fireEvent.click(todoCard as HTMLButtonElement, { metaKey: true });

    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open in Lite edit mode/i }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("# Agenda");
  });

  it("toggles collapsible preview sections from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    expect(document.querySelector(".preview-section")).toBeNull();

    const agendaCard = screen.getAllByText("Agenda")[0].closest("button");
    expect(agendaCard).toBeTruthy();
    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Enable collapsible sections" }));
    expect(document.querySelector(".preview-section")).toBeTruthy();

    fireEvent.contextMenu(agendaCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Disable collapsible sections" }));
    expect(document.querySelector(".preview-section")).toBeNull();
  });

  it("opens note context menu from keyboard context-menu key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.keyDown(noteCard as HTMLButtonElement, { key: "ContextMenu" });

    expect(screen.getByRole("menu", { name: "Note actions" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open in new window/i })).toBeInTheDocument();
  });

  it("exposes note card quick action trigger as a menu button", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.mouseEnter(noteCard as HTMLButtonElement);

    const trigger = document.querySelector(".note-card-menu") as HTMLElement | null;
    expect(trigger).toBeTruthy();
    expect(trigger as HTMLElement).toHaveAttribute("role", "button");
    expect(trigger as HTMLElement).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger as HTMLElement).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger as HTMLElement);
    expect(trigger as HTMLElement).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu", { name: "Note actions" })).toBeInTheDocument();
  });

  it("opens notebook context menu from keyboard context-menu key", () => {
    render(<App />);
    const notebookItem = document.querySelector(".notebook-item") as HTMLButtonElement | null;
    expect(notebookItem).toBeTruthy();

    fireEvent.keyDown(notebookItem as HTMLButtonElement, { key: "ContextMenu" });
    expect(screen.getByRole("menu", { name: /Notebook actions for/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename notebook" })).toBeInTheDocument();
  });

  it("opens stack context menu from keyboard context-menu key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "+ New stack" }));
    fireEvent.change(screen.getByPlaceholderText("Stack name"), { target: { value: "Planning" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    const stackHeader = screen.getByRole("button", { name: /Planning/i });
    fireEvent.keyDown(stackHeader, { key: "ContextMenu" });
    expect(screen.getByRole("menu", { name: /Stack actions for Planning/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename stack" })).toBeInTheDocument();
  });

  it("navigates notebook tree rows with arrow keys", () => {
    render(<App />);

    const notebookRows = Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    expect(notebookRows.length).toBeGreaterThan(1);

    notebookRows[0]?.focus();
    fireEvent.keyDown(notebookRows[0] as HTMLButtonElement, { key: "ArrowDown" });
    expect(document.activeElement).toBe(notebookRows[1]);

    fireEvent.keyDown(notebookRows[1] as HTMLButtonElement, { key: "ArrowUp" });
    expect(document.activeElement).toBe(notebookRows[0]);
  });

  it("jumps to notebook tree boundaries with home and end keys", () => {
    render(<App />);

    const treeRows = Array.from(document.querySelectorAll('button[data-sidebar-tree-item="true"]')) as HTMLButtonElement[];
    expect(treeRows.length).toBeGreaterThan(1);

    treeRows[0]?.focus();
    fireEvent.keyDown(treeRows[0] as HTMLButtonElement, { key: "End" });
    expect(document.activeElement).toBe(treeRows[treeRows.length - 1]);

    fireEvent.keyDown(treeRows[treeRows.length - 1] as HTMLButtonElement, { key: "Home" });
    expect(document.activeElement).toBe(treeRows[0]);
  });

  it("navigates stack header and nested notebook rows with arrow keys", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const stackedDailyNotebook = () =>
      (Array.from(document.querySelectorAll(".stack-group .notebook-item")) as HTMLButtonElement[]).find((entry) =>
        entry.textContent?.includes("Daily Notes")
      );

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const stackHeader = screen.getByRole("button", { name: /Ops/i });
    stackHeader.focus();

    fireEvent.keyDown(stackHeader, { key: "ArrowLeft" });
    expect(stackedDailyNotebook()).toBeUndefined();

    fireEvent.keyDown(stackHeader, { key: "ArrowRight" });
    expect(stackedDailyNotebook()).toBeTruthy();

    fireEvent.keyDown(stackHeader, { key: "ArrowRight" });
    const nested = stackedDailyNotebook();
    expect(nested).toBeTruthy();
    expect(document.activeElement).toBe(nested);

    fireEvent.keyDown(nested as HTMLButtonElement, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(stackHeader);
  });

  it("adds notebook shortcuts from notebook context menu", () => {
    render(<App />);
    const notebookItems = document.querySelectorAll(".notebook-item");
    expect(notebookItems.length).toBeGreaterThan(1);

    const dailyNotebook = Array.from(notebookItems).find((entry) => entry.textContent?.includes("Daily Notes"));
    expect(dailyNotebook).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Add notebook shortcut" }));

    expect(screen.getByRole("button", { name: "Remove notebook shortcut Daily Notes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("keeps notebook references in shortcuts and saved searches after notebook rename", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.click(dailyNotebook() as HTMLButtonElement);
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Add notebook shortcut" }));
    expect(screen.getByRole("button", { name: "Remove notebook shortcut Daily Notes" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Daily scoped" } });
    fireEvent.change(screen.getByLabelText("Scope"), { target: { value: "current" } });
    fireEvent.change(screen.getByLabelText("Notebook"), { target: { value: "Daily Notes" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Rename notebook" }));
    const renameModalHeading = screen.getByRole("heading", { name: "Rename notebook", level: 3 });
    const renameModal = renameModalHeading.closest("section") as HTMLElement;
    fireEvent.change(within(renameModal).getByRole("textbox"), { target: { value: "Journal Hub" } });
    fireEvent.click(within(renameModal).getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: "Remove notebook shortcut Journal Hub" })).toBeInTheDocument();
    expect(screen.getByText("In Journal Hub")).toBeInTheDocument();

    const otherNotebook = notebookItems().find((entry) => entry.textContent?.includes("Inbox"));
    expect(otherNotebook).toBeTruthy();
    fireEvent.click(otherNotebook as HTMLButtonElement);
    expect(screen.queryByRole("heading", { name: "Journal Hub", level: 1 })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Daily scoped/i }));
    expect(screen.getByRole("heading", { name: "Journal Hub", level: 1 })).toBeInTheDocument();
  });

  it("creates a stack from the sidebar action", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "+ New stack" }));
    expect(screen.getByRole("heading", { name: "New stack", level: 3 })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Stack name"), { target: { value: "Workstream" } });
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(screen.getByRole("button", { name: /Workstream/i })).toBeInTheDocument();
  });

  it("renames a stack from stack context menu", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const opsStack = screen.getByRole("button", { name: /Ops/i });
    fireEvent.contextMenu(opsStack);
    fireEvent.click(screen.getByRole("button", { name: "Rename stack" }));
    const renameModalHeading = screen.getByRole("heading", { name: "Rename stack", level: 3 });
    const renameModal = renameModalHeading.closest("section") as HTMLElement;
    fireEvent.change(within(renameModal).getByRole("textbox"), { target: { value: "Projects" } });
    fireEvent.click(within(renameModal).getByRole("button", { name: "Save" }));

    expect(screen.getByRole("button", { name: /Projects/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ops/i })).not.toBeInTheDocument();
  });

  it("removes stack and keeps notebooks available", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const opsStack = screen.getByRole("button", { name: /Ops/i });
    fireEvent.contextMenu(opsStack);
    fireEvent.click(screen.getByRole("button", { name: "Remove stack" }));

    expect(screen.queryByRole("button", { name: /Ops/i })).not.toBeInTheDocument();
    expect(notebookItems().some((entry) => entry.textContent?.includes("Daily Notes"))).toBe(true);
  });

  it("unstacks a notebook by dragging it to unstack target", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));

    expect(dailyNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;
    fireEvent.dragStart(dailyNotebook() as HTMLButtonElement, { dataTransfer });

    const dropTarget = screen.getByText("Drop to remove from stack");
    fireEvent.dragOver(dropTarget);
    fireEvent.drop(dropTarget);

    expect(screen.getByRole("button", { name: /Ops/i })).toBeInTheDocument();
    expect(notebookItems().some((entry) => entry.textContent?.includes("Daily Notes"))).toBe(true);
  });

  it("stacks a notebook by dragging it onto a stack header", () => {
    render(<App />);
    const notebookItems = () => Array.from(document.querySelectorAll(".notebook-item")) as HTMLButtonElement[];
    const dailyNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Daily Notes"));
    const inboxNotebook = () => notebookItems().find((entry) => entry.textContent?.includes("Inbox"));
    const stackedNotebook = (name: string) =>
      (Array.from(document.querySelectorAll(".stack-group .notebook-item")) as HTMLButtonElement[]).find((entry) =>
        entry.textContent?.includes(name)
      );

    expect(dailyNotebook()).toBeTruthy();
    expect(inboxNotebook()).toBeTruthy();
    fireEvent.contextMenu(dailyNotebook() as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: "Move to stack..." }));
    fireEvent.change(screen.getByPlaceholderText("New stack name"), { target: { value: "Ops" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    const opsStack = screen.getByRole("button", { name: /Ops/i });
    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;
    fireEvent.dragStart(inboxNotebook() as HTMLButtonElement, { dataTransfer });
    fireEvent.dragOver(opsStack);
    fireEvent.drop(opsStack);

    expect(stackedNotebook("Inbox")).toBeTruthy();
  });

  it("adds tag shortcuts and applies tag filter from shortcut", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.click(screen.getByRole("button", { name: "Add tag" }));
    fireEvent.change(document.getElementById("tag-input") as HTMLInputElement, { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.change(screen.getByLabelText("Add tag shortcut"), { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByRole("button", { name: "Remove tag shortcut focus" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tag: #focus/i }));
    expect(screen.getByRole("button", { name: "#focus ×" })).toBeInTheDocument();
  });

  it("opens editor context menu from keyboard context-menu key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    (editor as HTMLTextAreaElement).focus();
    fireEvent.keyDown(editor as HTMLTextAreaElement, { key: "ContextMenu" });
    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    expect(screen.getByRole("menu", { name: "Editor context menu" })).toBeInTheDocument();
    expect(within(menu as HTMLElement).getByRole("button", { name: "Bold" })).toBeInTheDocument();
    expect(within(menu as HTMLElement).getByRole("button", { name: "Align center" })).toBeInTheDocument();
  });

  it("inserts markdown link from editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, { target: { value: "Agenda" } });
    (editor as HTMLTextAreaElement).focus();
    (editor as HTMLTextAreaElement).setSelectionRange(0, 6);
    fireEvent.contextMenu(editor as HTMLTextAreaElement);

    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Insert link" }));

    expect((editor as HTMLTextAreaElement).value).toContain("[Agenda](https://)");
    expect(document.querySelector(".editor-context-menu")).toBeNull();
  });

  it("inserts superscript from markdown editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, { target: { value: "x" } });
    (editor as HTMLTextAreaElement).focus();
    (editor as HTMLTextAreaElement).setSelectionRange(0, 1);
    fireEvent.contextMenu(editor as HTMLTextAreaElement);

    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Superscript" }));

    expect((editor as HTMLTextAreaElement).value).toContain("<sup>x</sup>");
  });

  it("inserts subscript from markdown editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, { target: { value: "x" } });
    (editor as HTMLTextAreaElement).focus();
    (editor as HTMLTextAreaElement).setSelectionRange(0, 1);
    fireEvent.contextMenu(editor as HTMLTextAreaElement);

    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Subscript" }));

    expect((editor as HTMLTextAreaElement).value).toContain("<sub>x</sub>");
  });

  it("inserts numbered list from editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.contextMenu(editor as HTMLTextAreaElement);
    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Numbered list" }));

    expect((editor as HTMLTextAreaElement).value).toContain("1. item");
  });

  it("applies large header from editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, { target: { value: "Roadmap" } });
    (editor as HTMLTextAreaElement).focus();
    (editor as HTMLTextAreaElement).setSelectionRange(0, 7);
    fireEvent.contextMenu(editor as HTMLTextAreaElement);

    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Large header" }));

    expect((editor as HTMLTextAreaElement).value).toContain("# Roadmap");
  });

  it("inserts code block from editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.contextMenu(editor as HTMLTextAreaElement);
    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Code block" }));

    expect((editor as HTMLTextAreaElement).value).toContain("```text");
  });

  it("inserts table of contents from editor context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();

    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n## Meetings\n\n## Appointments\n" }
    });
    fireEvent.contextMenu(editor as HTMLTextAreaElement);
    const menu = document.querySelector(".editor-context-menu") as HTMLElement | null;
    expect(menu).toBeTruthy();
    fireEvent.click(within(menu as HTMLElement).getByRole("button", { name: "Table of contents" }));

    expect((editor as HTMLTextAreaElement).value).toContain("## Table of contents");
    expect((editor as HTMLTextAreaElement).value).toContain("- [Agenda](#agenda)");
    expect((editor as HTMLTextAreaElement).value).toContain("  - [Meetings](#meetings)");
  });

  it("inserts a table from rich editor context menu", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Rich" }));
    const editor = document.querySelector(".rich-editor-content") as HTMLElement | null;
    expect(editor).toBeTruthy();

    fireEvent.contextMenu(editor as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Insert table" }));

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    await waitFor(() => {
      const markdownEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
      expect(markdownEditor?.value).toContain("| --- | --- |");
    });
  });

  it("inserts formula from rich editor context menu", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Rich" }));
    const editor = document.querySelector(".rich-editor-content") as HTMLElement | null;
    expect(editor).toBeTruthy();

    fireEvent.contextMenu(editor as HTMLElement);
    fireEvent.click(screen.getByRole("button", { name: "Formula" }));

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));
    await waitFor(() => {
      const markdownEditor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
      expect(markdownEditor?.value).toContain("$$");
    });
  });

  it("supports arrow navigation and enter for focused editor mode", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.getByRole("heading", { name: "To-do list", level: 2 })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.queryByRole("heading", { name: "Preview", level: 3 })).not.toBeInTheDocument();
  });

  it("opens find in note from keyboard and cycles matches", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\nalpha test\n\nalpha repeat" }
    });

    fireEvent.keyDown(window, { key: "f", metaKey: true });
    const findBar = screen.getByRole("search", { name: "Find in note" });
    expect(findBar).toBeInTheDocument();

    const findInput = within(findBar).getByRole("textbox", { name: "Find in note" });
    fireEvent.change(findInput, { target: { value: "alpha" } });
    expect(screen.getByText("1 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next match" }));
    expect(screen.getByText("2 of 2")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous match" }));
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("opens find in note using KeyF keyboard code", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    fireEvent.keyDown(window, { key: "ƒ", code: "KeyF", metaKey: true });
    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens find in note from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Find in note/i }));

    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
  });

  it("opens tasks from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open tasks/i }));

    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens files from note context menu", () => {
    render(<App />);
    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Agenda\n\n[Doc PDF](./attachments/brief.pdf)" }
    });

    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open files/i }));

    expect(screen.getByRole("heading", { name: "Files", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens calendar from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open calendar/i }));

    expect(screen.getByRole("heading", { name: "Calendar", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Current note \(/ })).toHaveClass("active");
  });

  it("opens reminders from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Open reminders/i }));

    expect(screen.getByRole("heading", { name: "Reminders", level: 1 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Current note" })).toHaveClass("active");
  });

  it("opens tag editor for the context menu target note", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const toDoCard = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card")).find((entry) =>
      entry.textContent?.includes("To-do list")
    );
    expect(toDoCard).toBeTruthy();
    fireEvent.contextMenu(toDoCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Edit tags/i }));

    expect(screen.getByRole("heading", { name: "To-do list", level: 2 })).toBeInTheDocument();
    await waitFor(() => expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement));
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

  it("supports shift-click range selection for note cards", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[2] as HTMLButtonElement, { shiftKey: true });

    expect(screen.getByRole("toolbar", { name: "Bulk note actions" })).toBeInTheDocument();
    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("supports shift+arrow range selection from keyboard note navigation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(cards[0] as HTMLButtonElement);

    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(screen.getByText("3 selected")).toBeInTheDocument();
  });

  it("supports shift+end range selection from keyboard note navigation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(cards[0] as HTMLButtonElement);

    fireEvent.keyDown(window, { key: "End", shiftKey: true });
    const selectedCount = Number.parseInt(screen.getByText(/selected$/i).textContent?.split(" ")[0] ?? "0", 10);
    expect(selectedCount).toBeGreaterThanOrEqual(3);
  });

  it("supports home/end navigation without shift from keyboard note navigation", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    const firstTitle = cards[0]?.querySelector("strong")?.textContent?.trim() ?? "";
    const lastTitle = cards[cards.length - 1]?.querySelector("strong")?.textContent?.trim() ?? "";
    expect(firstTitle).not.toHaveLength(0);
    expect(lastTitle).not.toHaveLength(0);

    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.keyDown(window, { key: "End" });

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain(`# ${lastTitle}`);

    fireEvent.keyDown(window, { key: "Home" });
    expect(editor?.value).toContain(`# ${firstTitle}`);
  });

  it("collapses keyboard range selection when moving without shift", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.keyDown(window, { key: "ArrowDown", shiftKey: true });
    expect(screen.getByText("2 selected")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "ArrowDown" });
    expect(screen.queryByText("2 selected")).not.toBeInTheDocument();
  });

  it("copies multi-selected notes from bulk actions", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card"));
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    const bulkActions = screen.getByRole("toolbar", { name: "Bulk note actions" });
    fireEvent.click(within(bulkActions).getByRole("button", { name: "Copy" }));
    const moveModal = screen.getByRole("heading", { name: "Copy to", level: 3 }).closest("section");
    expect(moveModal).toBeTruthy();
    fireEvent.click(within(moveModal as HTMLElement).getByRole("button", { name: "Inbox" }));
    fireEvent.click(within(moveModal as HTMLElement).getByRole("button", { name: "Done" }));

    await waitFor(() => {
      expect(screen.getByText("2 notes copied to Inbox")).toBeInTheDocument();
    });

    const notebookItems = Array.from(document.querySelectorAll<HTMLButtonElement>(".notebook-item"));
    const inboxNotebook = notebookItems.find((entry) => entry.textContent?.includes("Inbox"));
    expect(inboxNotebook).toBeTruthy();
    fireEvent.click(inboxNotebook as HTMLButtonElement);

    expect(screen.getByRole("heading", { name: "Inbox", level: 1 })).toBeInTheDocument();
    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getByText("Agenda copy 1")).toBeInTheDocument();
    expect(within(notesList).getByText("To-do list copy 2")).toBeInTheDocument();
  });

  it("copies markdown for multi-selected notes from bulk actions", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card"));
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: /Copy markdown/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const payload = String(writeText.mock.calls[0]?.[0] ?? "");
    expect(payload).toContain("# Agenda");
    expect(payload).toContain("# To-do list");
    expect(payload).toContain("\n\n---\n\n");
    expect(screen.getByText("Markdown copied for 2 notes")).toBeInTheDocument();
  });

  it("copies html for multi-selected notes from bulk actions", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card"));
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: /Copy HTML/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const payload = String(writeText.mock.calls[0]?.[0] ?? "");
    expect(payload).toContain("<h1>Agenda</h1>");
    expect(payload).toContain("<h1>To-do list</h1>");
    expect(payload).toContain("<!-- --- -->");
    expect(screen.getByText("HTML copied for 2 notes")).toBeInTheDocument();
  });

  it("copies text for multi-selected notes from bulk actions", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card"));
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: /Copy text/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const payload = String(writeText.mock.calls[0]?.[0] ?? "");
    expect(payload).toContain("Priority 1");
    expect(payload).toContain("High priority");
    expect(payload).toContain("\n\n---\n\n");
    expect(screen.getByText("Text copied for 2 notes")).toBeInTheDocument();
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

  it("edits tags for multi-selected notes from bulk actions", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Edit Tags" }));
    expect(screen.getByRole("heading", { name: "Edit tags", level: 3 })).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("tag"), { target: { value: "focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(
      screen.getByText((content) => content.includes("#focus") && (content.includes("added to") || content.includes("already")))
    ).toBeInTheDocument();

    const editorFooter = document.querySelector(".editor-footer");
    expect(editorFooter).toBeTruthy();

    fireEvent.click(cards[0] as HTMLButtonElement);
    expect(within(editorFooter as HTMLElement).getByRole("button", { name: "#focus" })).toBeInTheDocument();
    fireEvent.click(cards[1] as HTMLButtonElement);
    expect(within(editorFooter as HTMLElement).getByRole("button", { name: "#focus" })).toBeInTheDocument();
  });

  it("opens bulk tag editor from note context menu on multi-select", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.contextMenu(cards[1] as HTMLButtonElement);
    const contextMenu = document.querySelector(".context-menu") as HTMLElement | null;
    expect(contextMenu).toBeTruthy();
    fireEvent.click(within(contextMenu as HTMLElement).getByRole("button", { name: /Edit tags/i }));

    expect(screen.getByRole("heading", { name: "Edit tags", level: 3 })).toBeInTheDocument();
    const bulkTagModal = document.querySelector(".bulk-tag-modal") as HTMLElement | null;
    expect(bulkTagModal).toBeTruthy();
    expect(within(bulkTagModal as HTMLElement).getByText("2 selected")).toBeInTheDocument();
  });

  it("moves multi-selected notes by dragging one selected card", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = Array.from(document.querySelectorAll<HTMLButtonElement>(".note-grid .note-card"));
    expect(cards.length).toBeGreaterThanOrEqual(2);
    const firstTitle = cards[0]?.querySelector("strong")?.textContent?.trim() ?? "";
    const secondTitle = cards[1]?.querySelector("strong")?.textContent?.trim() ?? "";
    expect(firstTitle).not.toBe("");
    expect(secondTitle).not.toBe("");

    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    const dataTransfer = {
      effectAllowed: "move",
      setData: vi.fn(),
      getData: vi.fn()
    } as unknown as DataTransfer;
    fireEvent.dragStart(cards[1] as HTMLButtonElement, { dataTransfer });

    const notebookItems = Array.from(document.querySelectorAll<HTMLButtonElement>(".notebook-item"));
    const inboxNotebook = notebookItems.find((entry) => entry.textContent?.includes("Inbox"));
    expect(inboxNotebook).toBeTruthy();
    fireEvent.dragOver(inboxNotebook as HTMLButtonElement, { dataTransfer });
    fireEvent.drop(inboxNotebook as HTMLButtonElement, { dataTransfer });

    fireEvent.click(inboxNotebook as HTMLButtonElement);
    expect(screen.getByRole("heading", { name: "Inbox", level: 1 })).toBeInTheDocument();
    const notesList = screen.getByLabelText("Notes list");
    expect(within(notesList).getByText(firstTitle)).toBeInTheDocument();
    expect(within(notesList).getByText(secondTitle)).toBeInTheDocument();
  });

  it("moves the active note to trash with cmd+backspace", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));
    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    expect(screen.getByRole("heading", { name: "Trash", level: 1 })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Notes list")).getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
  });

  it("moves selected notes to trash with cmd+backspace", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const cards = document.querySelectorAll(".note-grid .note-card");
    expect(cards.length).toBeGreaterThanOrEqual(2);
    fireEvent.click(cards[0] as HTMLButtonElement);
    fireEvent.click(cards[1] as HTMLButtonElement, { metaKey: true });

    fireEvent.keyDown(window, { key: "Backspace", metaKey: true });
    expect(screen.getByText("2 notes moved to Trash")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Trash" }));
    const trashedCards = document.querySelectorAll(".note-grid .note-card");
    expect(trashedCards.length).toBeGreaterThanOrEqual(2);
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
    fireEvent.click(
      within(sourceOutgoingSection as HTMLElement).getByRole("button", { name: "Open preview outgoing link Daily Journal" })
    );

    expect(screen.getByRole("heading", { name: "Daily Journal", level: 2 })).toBeInTheDocument();
    const targetOutgoingSection = screen.getByRole("heading", { name: "Outgoing links", level: 5 }).closest("section");
    expect(targetOutgoingSection).toBeTruthy();
    expect(
      within(targetOutgoingSection as HTMLElement).getByRole("button", { name: "Open preview outgoing link Agenda" })
    ).toBeInTheDocument();
  });

  it("toggles auto reciprocal links from the editor header", () => {
    render(<App />);
    const autoLinksButton = screen.getByRole("button", { name: "Auto links" });
    expect(autoLinksButton).not.toHaveClass("active");

    fireEvent.click(autoLinksButton);
    expect(autoLinksButton).toHaveClass("active");
  });

  it("uses unsaved draft content for AI note context", async () => {
    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "Draft context received"
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    fireEvent.change(editor as HTMLTextAreaElement, {
      target: { value: "# Draft AI Context\n\nUnsaved sentence for AI context." }
    });

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "What should I do next?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/Draft context received/)).toBeInTheDocument();
    expect(chatWithLlm).toHaveBeenCalledTimes(1);
    const payload = chatWithLlm.mock.calls[0][0] as { messages: Array<{ role: string; content: string }> };
    const contextMessage = payload.messages.find(
      (entry) => entry.role === "system" && entry.content.includes("Vault context (use only if relevant):")
    );
    expect(contextMessage?.content).toContain("Title: Draft AI Context");
    expect(contextMessage?.content).toContain("Unsaved sentence for AI context.");
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

  it("copies AI response text from assistant message", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true
    });

    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "Try batching your deep-work blocks."
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "How should I plan this week?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/deep-work blocks/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Copy response" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Try batching your deep-work blocks."));
    expect(screen.getByText("AI response copied")).toBeInTheDocument();
  });

  it("inserts AI chat transcript into the active note from the AI panel", async () => {
    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "Start with your highest leverage task."
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "What should I do first today?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText(/highest leverage task/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Insert chat" }));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("### AI chat transcript");
    expect(editor?.value).toContain("#### You");
    expect(editor?.value).toContain("What should I do first today?");
    expect(editor?.value).toContain("#### Copilot");
    expect(editor?.value).toContain("Start with your highest leverage task.");
  });

  it("inserts AI chat transcript from command palette action", async () => {
    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "Block 60 minutes for focused writing."
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "How should I structure this afternoon?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/focused writing/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">insert ai chat transcript" } });
    fireEvent.click(screen.getByText("Insert AI chat transcript into note"));

    const editor = document.querySelector(".markdown-editor") as HTMLTextAreaElement | null;
    expect(editor).toBeTruthy();
    expect(editor?.value).toContain("### AI chat transcript");
    expect(editor?.value).toContain("How should I structure this afternoon?");
    expect(editor?.value).toContain("Block 60 minutes for focused writing.");
  });

  it("clears AI chat from command palette action", async () => {
    const chatWithLlm = vi.fn().mockResolvedValue({
      message: "Keep your morning block focused."
    });
    (window as unknown as { pkmShell?: { chatWithLlm: typeof chatWithLlm } }).pkmShell = { chatWithLlm };

    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.change(screen.getByPlaceholderText("Ask about this note or your vault..."), {
      target: { value: "How should I begin?" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/morning block focused/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear ai chat" } });
    fireEvent.click(screen.getByText("Clear AI chat"));

    expect(screen.getByText("Cleared AI chat")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    expect(screen.queryByText(/morning block focused/i)).not.toBeInTheDocument();
  });

  it("shows guard message when clearing AI chat from command palette with no messages", () => {
    render(<App />);

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    const searchInput = screen.getByPlaceholderText("Search or ask a question");
    fireEvent.change(searchInput, { target: { value: ">clear ai chat" } });
    fireEvent.click(screen.getByText("Clear AI chat"));

    expect(screen.getByText("AI chat already empty")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search or ask a question")).not.toBeInTheDocument();
  });

  it("saves configurable git backup settings", async () => {
    const getGitBackupStatus = vi.fn().mockResolvedValue({
      enabled: true,
      commitPrefix: "Vault backup",
      autosaveDelayMs: 4000,
      autoPush: false,
      pushRemote: "origin",
      pushBranch: "main",
      available: true,
      repoReady: true,
      dirty: false,
      busy: false,
      lastRunAt: null,
      lastCommitAt: null,
      lastCommitHash: "",
      lastError: ""
    });
    const setGitBackupSettings = vi.fn().mockResolvedValue({
      enabled: true,
      commitPrefix: "Snapshots",
      autosaveDelayMs: 7000,
      autoPush: true,
      pushRemote: "origin",
      pushBranch: "main",
      available: true,
      repoReady: true,
      dirty: false,
      busy: false,
      lastRunAt: null,
      lastCommitAt: null,
      lastCommitHash: "",
      lastError: ""
    });
    (window as unknown as { pkmShell?: unknown }).pkmShell = {
      getGitBackupStatus,
      setGitBackupSettings
    };

    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "AI" }));
    fireEvent.click(screen.getByRole("button", { name: "Settings" }));

    const prefixInput = await screen.findByLabelText("Commit prefix");
    fireEvent.change(prefixInput, { target: { value: "Snapshots" } });
    fireEvent.change(screen.getByLabelText("Autosave delay (seconds)"), { target: { value: "7" } });
    fireEvent.click(screen.getByLabelText("Auto-push backups"));
    fireEvent.change(screen.getByLabelText("Push remote"), { target: { value: "origin" } });
    fireEvent.change(screen.getByLabelText("Push branch"), { target: { value: "main" } });
    fireEvent.click(screen.getByRole("button", { name: "Save backup settings" }));

    await waitFor(() =>
      expect(setGitBackupSettings).toHaveBeenCalledWith({
        commitPrefix: "Snapshots",
        autosaveDelayMs: 7000,
        autoPush: true,
        pushRemote: "origin",
        pushBranch: "main"
      })
    );
  });

});
