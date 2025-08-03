"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Strikethrough, 
  Link as LinkIcon,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon
} from "lucide-react";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  editable?: boolean;
  placeholder?: string;
}

/**
 * Simple rich text editor component
 * Note: This is a simplified placeholder version. In a real implementation, you would use a 
 * proper rich text editor library like TipTap, TinyMCE, or React-Quill with proper formatting.
 */
const Editor = ({ value, onChange, editable = true, placeholder = "Write something..." }: EditorProps) => {

  // Add a function to handle basic HTML formatting
  const insertFormat = (tag: string) => {
    // In a real implementation, this would apply proper formatting
    // For now, just append some placeholder text
    onChange(value + `[${tag} formatting would be applied here]`);
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) {
      onChange(value + `\n<img src="${url}" alt="Image" />\n`);
    }
  };

  const addLink = () => {
    const url = window.prompt("Link URL");
    const text = window.prompt("Link text");
    if (url && text) {
      onChange(value + `<a href="${url}">${text}</a>`);
    }
  };

  return (
    <div className="border rounded-md overflow-hidden">
      {editable && (
        <div className="flex flex-wrap items-center p-2 gap-1 border-b bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('bold')}
            className="p-2 h-8 w-8"
          >
            <BoldIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('italic')}
            className="p-2 h-8 w-8"
          >
            <ItalicIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('underline')}
            className="p-2 h-8 w-8"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('strikethrough')}
            className="p-2 h-8 w-8"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
          <div className="bg-muted w-px h-6 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('h1')}
            className="p-2 h-8 w-8"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('h2')}
            className="p-2 h-8 w-8"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('h3')}
            className="p-2 h-8 w-8"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
          <div className="bg-muted w-px h-6 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('bulletList')}
            className="p-2 h-8 w-8"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('orderedList')}
            className="p-2 h-8 w-8"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('taskList')}
            className="p-2 h-8 w-8"
          >
            <CheckSquare className="h-4 w-4" />
          </Button>
          <div className="bg-muted w-px h-6 mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => insertFormat('code')}
            className="p-2 h-8 w-8"
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addLink}
            className="p-2 h-8 w-8"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addImage}
            className="p-2 h-8 w-8"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* Use a textarea as a simple fallback for the rich text editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[150px] w-full p-3 focus:outline-none resize-y"
        placeholder={placeholder}
        disabled={!editable}
      />
    </div>
  );
};

export default Editor;
