"use client";

import { Bold, Italic, List } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sanitizeTeacherSolutionHtml } from "@/lib/utils/sanitize-html";

type RichTextEditorProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function RichTextEditor({ id, value, onChange, disabled }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  function runCommand(command: "bold" | "italic" | "insertUnorderedList") {
    editorRef.current?.focus();
    document.execCommand(command);
    onChange(editorRef.current?.innerHTML ?? "");
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <div className="flex items-center gap-1 border-b bg-secondary/50 p-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => runCommand("bold")}
          aria-label="Bold"
        >
          <Bold className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => runCommand("italic")}
          aria-label="Italic"
        >
          <Italic className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={disabled}
          onClick={() => runCommand("insertUnorderedList")}
          aria-label="Bullet list"
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <div
        id={id}
        ref={editorRef}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          "min-h-44 px-3 py-2 text-sm leading-7 outline-none",
          "prose prose-sm max-w-none",
          disabled && "cursor-not-allowed opacity-70",
        )}
        dangerouslySetInnerHTML={{ __html: sanitizeTeacherSolutionHtml(value) }}
        onInput={(event) => onChange(sanitizeTeacherSolutionHtml(event.currentTarget.innerHTML))}
      />
    </div>
  );
}
