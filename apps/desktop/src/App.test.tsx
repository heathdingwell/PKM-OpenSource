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

  it("opens shortcuts browse mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Shortcuts" }));
    expect(screen.getByRole("heading", { name: "Shortcuts", level: 1 })).toBeInTheDocument();
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

  it("opens graph mode from the sidebar", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Graph" }));
    expect(screen.getByRole("heading", { name: "Graph", level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText("Graph view")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agenda" })).toBeInTheDocument();
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

  it("toggles focus mode with keyboard shortcut", () => {
    render(<App />);
    const shell = screen.getByRole("application", { name: "PKM OpenSource Shell" });

    fireEvent.keyDown(window, { key: "\\", metaKey: true, shiftKey: true });
    expect(shell).toHaveClass("focus-mode");

    fireEvent.keyDown(window, { key: "\\", metaKey: true, shiftKey: true });
    expect(shell).not.toHaveClass("focus-mode");
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

  it("opens note metadata with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "i", metaKey: true, shiftKey: true });
    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
  });

  it("opens note tags editor with keyboard shortcut", () => {
    render(<App />);

    fireEvent.keyDown(window, { key: "t", metaKey: true, altKey: true });
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.getElementById("tag-input")).toBeInstanceOf(HTMLInputElement);
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

  it("toggles note grouping by updated date and persists preference", () => {
    const first = render(<App />);
    expect(document.querySelectorAll(".note-group-heading").length).toBe(0);

    fireEvent.click(screen.getByRole("button", { name: "Group: Off" }));
    expect(document.querySelectorAll(".note-group-heading").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Group: Updated" })).toHaveClass("active");

    first.unmount();

    render(<App />);
    expect(screen.getByRole("button", { name: "Group: Updated" })).toBeInTheDocument();
    expect(document.querySelectorAll(".note-group-heading").length).toBeGreaterThan(0);
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

  it("opens note metadata from command palette", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: ">info" }
    });
    fireEvent.click(screen.getByText("Open note info"));

    expect(screen.getByRole("heading", { name: "Note metadata", level: 4 })).toBeInTheDocument();
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

  it("opens or creates today's note from sidebar action", async () => {
    render(<App />);
    const now = new Date();
    const todayTitle = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    fireEvent.click(screen.getByRole("button", { name: "Open today's note" }));
    expect(await screen.findByRole("heading", { name: todayTitle, level: 2 })).toBeInTheDocument();
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

  it("persists chip filters when saving and reopening a saved search", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Info" }));
    fireEvent.change(screen.getByLabelText("Reminder date"), { target: { value: "2099-01-01" } });

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.change(screen.getByPlaceholderText("Search or ask a question"), {
      target: { value: "agenda" }
    });
    fireEvent.click(screen.getByRole("button", { name: "Has due tasks" }));
    fireEvent.click(screen.getByRole("button", { name: "Has reminders" }));
    fireEvent.click(screen.getByRole("button", { name: "Save Search" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Due focus" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    fireEvent.click(screen.getByRole("button", { name: "Quick actions" }));
    fireEvent.keyDown(window, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /^Due focus/i }));
    const dueChip = screen.getByRole("button", { name: "Has due tasks" });
    const reminderChip = screen.getByRole("button", { name: "Has reminders" });
    expect(dueChip).toHaveClass("active");
    expect(reminderChip).toHaveClass("active");
    const queryInput = screen.getByPlaceholderText("Search or ask a question") as HTMLInputElement;
    expect(queryInput.value).toContain("has:due");
    expect(queryInput.value).toContain("has:reminder");
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
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("button", { name: "Image" }));

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
    fireEvent.mouseDown(within(slashMenu as HTMLElement).getByRole("button", { name: "Table of contents" }));

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
      target: { value: "# Agenda\n\nDate {{date}}\nTime {{time}}\nWhen {{datetime}}\nStamp {{timestamp}}\nTitle {{title}}" }
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
    expect(resultEditor?.value).not.toContain("{{title}}");
  });

  it("creates a task from the task dialog", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Create task" }));
    expect(screen.getByRole("heading", { name: "New task", level: 3 })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Task text"), { target: { value: "Quick task" } });
    fireEvent.click(screen.getByRole("button", { name: "Add task" }));
    expect(screen.getByRole("heading", { name: "Tasks", level: 3 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Quick task/i })).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole("button", { name: /Future task/i }));
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
    expect(screen.getByRole("button", { name: /Unsaved task from draft/i })).toBeInTheDocument();
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

  it("opens note context menu from keyboard context-menu key", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.keyDown(noteCard as HTMLButtonElement, { key: "ContextMenu" });

    expect(screen.getByRole("button", { name: /Open in new window/i })).toBeInTheDocument();
  });

  it("opens notebook context menu from keyboard context-menu key", () => {
    render(<App />);
    const notebookItem = document.querySelector(".notebook-item") as HTMLButtonElement | null;
    expect(notebookItem).toBeTruthy();

    fireEvent.keyDown(notebookItem as HTMLButtonElement, { key: "ContextMenu" });
    expect(screen.getByRole("button", { name: "Rename notebook" })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: /Agenda/ })).toBeInTheDocument();
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
    expect(screen.getByRole("button", { name: "Bold" })).toBeInTheDocument();
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

  it("opens find in note from note context menu", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Notes" }));

    const noteCard = document.querySelector(".note-grid .note-card") as HTMLButtonElement | null;
    expect(noteCard).toBeTruthy();
    fireEvent.contextMenu(noteCard as HTMLButtonElement);
    fireEvent.click(screen.getByRole("button", { name: /Find in note/i }));

    expect(screen.getByRole("search", { name: "Find in note" })).toBeInTheDocument();
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

  it("saves configurable git backup settings", async () => {
    const getGitBackupStatus = vi.fn().mockResolvedValue({
      enabled: true,
      commitPrefix: "Vault backup",
      autosaveDelayMs: 4000,
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
    fireEvent.click(screen.getByRole("button", { name: "Save backup settings" }));

    await waitFor(() =>
      expect(setGitBackupSettings).toHaveBeenCalledWith({
        commitPrefix: "Snapshots",
        autosaveDelayMs: 7000
      })
    );
  });

});
