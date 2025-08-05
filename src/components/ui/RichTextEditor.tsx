"use client";

import { forwardRef, useImperativeHandle } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Editor } from '@tiptap/core';




interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  height?: string;
}

export interface RichTextEditorRef {
  focus: () => void;
  blur: () => void;
  getEditor: () => Editor | null;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Start writing...", className = "", disabled = false, height = "200px" }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit,
        Image,
      ],
      content: value,
      editorProps: {
        attributes: {
          class: 'prose prose-sm max-w-none'
        }
      },
      editable: !disabled,
      onUpdate: ({ editor }) => {
        onChange(editor.getHTML());
      }
    }) as Editor | null;

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (editor) {
          editor.chain().focus().run();
        }
      },
      blur: () => {
        if (editor) {
          editor.chain().blur().run();
        }
      },
      getEditor: () => {
        return editor;
      }
    }));

    return (
      <div className={`rich-text-editor ${className}`}>
        <style jsx global>{`
          .ProseMirror {
            min-height: ${height};
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
            border: 1px solid #e5e7eb;
            border-radius: 0.375rem;
            background: white;
            padding: 1rem;
          }
          
          .ProseMirror:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
          
          .ProseMirror p.is-empty::before {
            content: attr(data-placeholder);
            float: left;
            color: #9ca3af;
            pointer-events: none;
            height: 0;
          }
          
          .ProseMirror.is-disabled {
            opacity: 0.6;
            pointer-events: none;
          }
        `}</style>
        
        <EditorContent 
          editor={editor} 
          data-placeholder={placeholder}
          className={`min-h-[${height}] ${className}`}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
