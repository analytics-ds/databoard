"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Image } from "@tiptap/extension-image";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { Highlight } from "@tiptap/extension-highlight";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  List,
  ListOrdered,
  ListChecks,
  Heading1,
  Heading2,
  Heading3,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Table as TableIcon,
  Minus,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface RichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function RichEditor({ content, onChange, placeholder, readOnly, className }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: true, HTMLAttributes: { class: "text-primary underline underline-offset-2" } }),
      Placeholder.configure({ placeholder: placeholder || "Écrivez ici..." }),
      Underline,
      Highlight.configure({ multicolor: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  function addImage() {
    const choice = window.confirm("OK = Coller une URL d'image\nAnnuler = Uploader depuis votre ordinateur");
    if (choice) {
      const url = window.prompt("URL de l'image :");
      if (url) editor?.chain().focus().setImage({ src: url }).run();
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        editor?.chain().focus().setImage({ src: reader.result as string }).run();
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function addTable() {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }

  const Sep = () => <div className="mx-0.5 h-4 w-px bg-border shrink-0" />;

  return (
    <div className={cn("rounded-lg border border-input overflow-hidden", className)}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-px border-b border-input bg-muted/30 px-1.5 py-1">
          {/* Headings */}
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Titre 1">
            <Heading1 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Titre 2">
            <Heading2 className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Titre 3">
            <Heading3 className="h-3.5 w-3.5" />
          </Btn>
          <Sep />

          {/* Text formatting */}
          <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Gras">
            <Bold className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italique">
            <Italic className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Souligné">
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Barré">
            <Strikethrough className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")} title="Surligné">
            <Highlighter className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Code inline">
            <Code className="h-3.5 w-3.5" />
          </Btn>
          <Sep />

          {/* Lists */}
          <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Liste à puces">
            <List className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Liste numérotée">
            <ListOrdered className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive("taskList")} title="Checklist">
            <ListChecks className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citation">
            <Quote className="h-3.5 w-3.5" />
          </Btn>
          <Sep />

          {/* Insert */}
          <Btn onClick={() => { const url = window.prompt("URL du lien :"); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={editor.isActive("link")} title="Lien">
            <LinkIcon className="h-3.5 w-3.5" />
          </Btn>
          {editor.isActive("link") && (
            <Btn onClick={() => editor.chain().focus().unsetLink().run()} title="Retirer le lien">
              <Unlink className="h-3.5 w-3.5" />
            </Btn>
          )}
          <Btn onClick={addImage} title="Image">
            <ImageIcon className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={addTable} title="Tableau">
            <TableIcon className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Ligne horizontale">
            <Minus className="h-3.5 w-3.5" />
          </Btn>
          <Sep />

          {/* Undo / redo */}
          <Btn onClick={() => editor.chain().focus().undo().run()} title="Annuler">
            <Undo className="h-3.5 w-3.5" />
          </Btn>
          <Btn onClick={() => editor.chain().focus().redo().run()} title="Rétablir">
            <Redo className="h-3.5 w-3.5" />
          </Btn>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        </div>
      )}
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-sm max-w-none px-4 py-3 min-h-[150px] focus-within:outline-none",
          "[&_.tiptap]:outline-none [&_.tiptap]:min-h-[130px]",
          "[&_.tiptap_p.is-editor-empty:first-child::before]:text-muted-foreground/40 [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none",
          // Table styling
          "[&_table]:border-collapse [&_table]:border [&_table]:border-border [&_table]:w-full [&_table]:rounded",
          "[&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-3 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-medium [&_th]:text-sm",
          "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-1.5 [&_td]:text-sm",
          // Task list
          "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
          "[&_ul[data-type=taskList]_li]:flex [&_ul[data-type=taskList]_li]:items-start [&_ul[data-type=taskList]_li]:gap-2",
          // Image
          "[&_img]:rounded-lg [&_img]:max-w-full [&_img]:border [&_img]:border-border",
          // Blockquote
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
          // Highlight
          "[&_mark]:bg-yellow-200 [&_mark]:rounded-sm [&_mark]:px-0.5",
          readOnly && "bg-muted/20"
        )}
      />
    </div>
  );
}

function Btn({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={title}
      className={cn("rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors", active && "bg-muted text-foreground")}>
      {children}
    </button>
  );
}
