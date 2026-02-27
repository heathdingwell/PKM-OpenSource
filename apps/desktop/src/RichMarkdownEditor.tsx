import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type ForwardedRef,
  type MouseEvent
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
import TurndownService from "turndown";

const markdownParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: true
}).use(markdownItTaskLists, { enabled: true, label: true, labelAfter: true });

function normalizeMarkdown(value: string): string {
  return value.replace(/\r\n/g, "\n").trim();
}

function markdownToHtml(markdown: string): string {
  const source = markdown.trim() ? markdown : "# Untitled\n";
  return markdownParser.render(source);
}

function createTurndownService(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-"
  });

  service.keep(["u", "sup", "sub"]);

  service.addRule("taskItemCheckbox", {
    filter(node) {
      return node.nodeName === "INPUT" && (node as HTMLInputElement).type === "checkbox";
    },
    replacement(_content, node) {
      const input = node as HTMLInputElement;
      return input.checked ? "[x] " : "[ ] ";
    }
  });

  service.addRule("taskItemList", {
    filter(node) {
      if (node.nodeName !== "LI") {
        return false;
      }
      const element = node as HTMLElement;
      return element.getAttribute("data-type") === "taskItem";
    },
    replacement(content) {
      const normalized = content.replace(/\s+/g, " ").trim();
      return `- ${normalized}\n`;
    }
  });

  return service;
}

function htmlToMarkdown(html: string, turndownService: TurndownService): string {
  return turndownService.turndown(html).replace(/\n{3,}/g, "\n\n");
}

export interface RichMarkdownEditorHandle {
  focus: () => void;
  toggleBold: () => void;
  toggleItalic: () => void;
  toggleUnderline: () => void;
  toggleStrike: () => void;
  toggleBlockquote: () => void;
  setHorizontalRule: () => void;
  toggleBulletList: () => void;
  toggleOrderedList: () => void;
  toggleTaskList: () => void;
  setHeading: (level: 1 | 2 | 3) => void;
  setParagraph: () => void;
  toggleCodeBlock: () => void;
  insertContent: (content: string) => void;
  replaceRange: (from: number, to: number, content: string) => void;
  setLink: (href: string) => void;
  unsetLink: () => void;
}

interface RichMarkdownEditorProps {
  markdown: string;
  onMarkdownChange: (markdown: string) => void;
  onSlashQueryChange?: (state: { query: string; from: number; to: number } | null) => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}

function RichMarkdownEditorInner(
  { markdown, onMarkdownChange, onSlashQueryChange, onContextMenu }: RichMarkdownEditorProps,
  ref: ForwardedRef<RichMarkdownEditorHandle>
) {
  const turndownService = useMemo(() => createTurndownService(), []);
  const suppressUpdateRef = useRef(false);
  const latestMarkdownRef = useRef(markdown);
  const lastSlashKeyRef = useRef<string | null>(null);

  useEffect(() => {
    latestMarkdownRef.current = markdown;
  }, [markdown]);

  function getSlashMatch(editorText: ReturnType<typeof useEditor>): { query: string; from: number; to: number } | null {
    if (!editorText || !onSlashQueryChange) {
      return null;
    }

    const selection = editorText.state.selection;
    if (!selection.empty) {
      return null;
    }

    const from = selection.from;
    const windowStart = Math.max(0, from - 80);
    const beforeText = editorText.state.doc.textBetween(windowStart, from, "\n", "\0");
    const match = beforeText.match(/(?:^|\s)\/([a-z0-9-]*)$/i);
    if (!match) {
      return null;
    }

    const raw = match[0];
    const offset = raw.startsWith(" ") ? 1 : 0;
    const start = from - raw.length + offset;
    return { query: match[1] ?? "", from: start, to: from };
  }

  function emitSlashMatch(editorText: ReturnType<typeof useEditor>): void {
    if (!onSlashQueryChange) {
      return;
    }

    const match = getSlashMatch(editorText);
    const key = match ? `${match.from}:${match.to}:${match.query}` : null;
    if (key === lastSlashKeyRef.current) {
      return;
    }

    lastSlashKeyRef.current = key;
    onSlashQueryChange(match);
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] }
      }),
      Link.configure({
        autolink: true,
        openOnClick: false,
        linkOnPaste: true
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Start writing..."
      })
    ],
    content: markdownToHtml(markdown),
    editorProps: {
      attributes: {
        class: "rich-editor-content"
      }
    },
    onUpdate({ editor: nextEditor }) {
      if (suppressUpdateRef.current) {
        return;
      }

      const nextMarkdown = htmlToMarkdown(nextEditor.getHTML(), turndownService);
      if (normalizeMarkdown(nextMarkdown) === normalizeMarkdown(latestMarkdownRef.current)) {
        emitSlashMatch(nextEditor);
        return;
      }

      onMarkdownChange(nextMarkdown);
      emitSlashMatch(nextEditor);
    },
    onSelectionUpdate({ editor: nextEditor }) {
      emitSlashMatch(nextEditor);
    }
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const editorMarkdown = htmlToMarkdown(editor.getHTML(), turndownService);
    if (normalizeMarkdown(editorMarkdown) === normalizeMarkdown(markdown)) {
      return;
    }

    suppressUpdateRef.current = true;
    editor.commands.setContent(markdownToHtml(markdown), { emitUpdate: false });
    suppressUpdateRef.current = false;
  }, [editor, markdown, turndownService]);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        editor?.commands.focus();
      },
      toggleBold: () => {
        editor?.chain().focus().toggleBold().run();
      },
      toggleItalic: () => {
        editor?.chain().focus().toggleItalic().run();
      },
      toggleUnderline: () => {
        editor?.chain().focus().toggleUnderline().run();
      },
      toggleStrike: () => {
        editor?.chain().focus().toggleStrike().run();
      },
      toggleBlockquote: () => {
        editor?.chain().focus().toggleBlockquote().run();
      },
      setHorizontalRule: () => {
        editor?.chain().focus().setHorizontalRule().run();
      },
      toggleBulletList: () => {
        editor?.chain().focus().toggleBulletList().run();
      },
      toggleOrderedList: () => {
        editor?.chain().focus().toggleOrderedList().run();
      },
      toggleTaskList: () => {
        editor?.chain().focus().toggleTaskList().run();
      },
      setHeading: (level: 1 | 2 | 3) => {
        editor?.chain().focus().toggleHeading({ level }).run();
      },
      setParagraph: () => {
        editor?.chain().focus().setParagraph().run();
      },
      toggleCodeBlock: () => {
        editor?.chain().focus().toggleCodeBlock().run();
      },
      insertContent: (content: string) => {
        editor?.chain().focus().insertContent(content).run();
      },
      replaceRange: (from: number, to: number, content: string) => {
        editor?.chain().focus().insertContentAt({ from, to }, content).run();
      },
      setLink: (href: string) => {
        editor?.chain().focus().setLink({ href }).run();
      },
      unsetLink: () => {
        editor?.chain().focus().unsetLink().run();
      }
    }),
    [editor]
  );

  return <EditorContent editor={editor} className="rich-editor-surface" onContextMenu={onContextMenu} />;
}

const RichMarkdownEditor = forwardRef(RichMarkdownEditorInner);

export default RichMarkdownEditor;
