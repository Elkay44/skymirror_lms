'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bold, Italic, List, ListOrdered, Heading, Quote, Code, Link as LinkIcon, Image } from 'lucide-react';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing your content here...",
  minHeight = 300
}) => {
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Helper to update text with formatting
  const formatText = (formatType: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    let newText = "";
    let newCursorPos = 0;

    switch (formatType) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        newCursorPos = selectedText ? end + 4 : start + 2;
        break;
      case 'italic':
        newText = value.substring(0, start) + `_${selectedText}_` + value.substring(end);
        newCursorPos = selectedText ? end + 2 : start + 1;
        break;
      case 'heading':
        // Insert at the beginning of the line
        const lineStart = value.substring(0, start).lastIndexOf('\n') + 1;
        newText = value.substring(0, lineStart) + '# ' + value.substring(lineStart);
        newCursorPos = end + 2;
        break;
      case 'list-ul':
        // Insert at the beginning of the line
        const ulLineStart = value.substring(0, start).lastIndexOf('\n') + 1;
        newText = value.substring(0, ulLineStart) + '- ' + value.substring(ulLineStart);
        newCursorPos = end + 2;
        break;
      case 'list-ol':
        // Insert at the beginning of the line
        const olLineStart = value.substring(0, start).lastIndexOf('\n') + 1;
        newText = value.substring(0, olLineStart) + '1. ' + value.substring(olLineStart);
        newCursorPos = end + 3;
        break;
      case 'quote':
        // Insert at the beginning of the line
        const quoteLineStart = value.substring(0, start).lastIndexOf('\n') + 1;
        newText = value.substring(0, quoteLineStart) + '> ' + value.substring(quoteLineStart);
        newCursorPos = end + 2;
        break;
      case 'code':
        if (selectedText) {
          newText = value.substring(0, start) + '`' + selectedText + '`' + value.substring(end);
          newCursorPos = end + 2;
        } else {
          newText = value.substring(0, start) + '```\n' + selectedText + '\n```' + value.substring(end);
          newCursorPos = start + 4;
        }
        break;
      case 'link':
        newText = value.substring(0, start) + `[${selectedText || 'Link text'}](url)` + value.substring(end);
        newCursorPos = start + 1 + (selectedText ? selectedText.length : 9) + 2; // Position cursor at "url"
        break;
      case 'image':
        newText = value.substring(0, start) + `![${selectedText || 'Image alt text'}](url)` + value.substring(end);
        newCursorPos = start + 2 + (selectedText ? selectedText.length : 14) + 2; // Position cursor at "url"
        break;
      default:
        return;
    }

    onChange(newText);
    
    // Set focus and cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="border rounded-md">
      <div className="bg-gray-50 p-2 border-b flex flex-wrap items-center gap-1">
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('bold')}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('italic')}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('heading')}
        >
          <Heading className="h-4 w-4" />
        </Button>
        <span className="w-px h-6 bg-gray-300 mx-1" />
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('list-ul')}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('list-ol')}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('quote')}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <span className="w-px h-6 bg-gray-300 mx-1" />
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('code')}
        >
          <Code className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('link')}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          className="h-8 w-8 p-0" 
          onClick={() => formatText('image')}
        >
          <Image className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 rounded-none rounded-b-md focus-visible:ring-0 min-h-[300px]"
        style={{ minHeight: `${minHeight}px` }}
      />
    </div>
  );
};
