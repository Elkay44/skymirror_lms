"use client";

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { 
  ssr: false,
  loading: () => <div className="h-32 bg-gray-50 animate-pulse rounded-md"></div>
});

import 'react-quill/dist/quill.snow.css';

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
  getEditor: () => any;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Start writing...", className = "", disabled = false, height = "200px" }, ref) => {
    const quillRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        if (quillRef.current) {
          quillRef.current.focus();
        }
      },
      blur: () => {
        if (quillRef.current) {
          quillRef.current.blur();
        }
      },
      getEditor: () => {
        return quillRef.current?.getEditor();
      }
    }));

    const modules = {
      toolbar: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      clipboard: {
        matchVisual: false,
      }
    };

    const formats = [
      'header', 'font', 'size',
      'bold', 'italic', 'underline', 'strike', 'blockquote',
      'list', 'bullet', 'indent',
      'link', 'image', 'video',
      'color', 'background',
      'align', 'code-block'
    ];

    return (
      <div className={`rich-text-editor ${className}`}>
        <style jsx global>{`
          .ql-editor {
            min-height: ${height};
            font-family: inherit;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .ql-toolbar {
            border-top: 1px solid #e5e7eb;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
            border-bottom: none;
            border-radius: 0.375rem 0.375rem 0 0;
            background: #f9fafb;
          }
          
          .ql-container {
            border-bottom: 1px solid #e5e7eb;
            border-left: 1px solid #e5e7eb;
            border-right: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 0.375rem 0.375rem;
            background: white;
          }
          
          .ql-editor.ql-blank::before {
            color: #9ca3af;
            font-style: normal;
          }
          
          .ql-snow .ql-tooltip {
            z-index: 1000;
          }
          
          .rich-text-editor .ql-disabled .ql-toolbar {
            opacity: 0.6;
            pointer-events: none;
          }
        `}</style>
        
        <ReactQuill
          ref={quillRef}
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
