import { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Code,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = '200px' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isUpdatingRef.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      isUpdatingRef.current = true;
      onChange(editorRef.current.innerHTML);
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  };

  const executeCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const formatButton = (
    icon: React.ReactNode,
    command: string,
    value?: string,
    title?: string
  ) => (
    <button
      type="button"
      onClick={() => executeCommand(command, value)}
      className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 hover:text-gray-900"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 bg-gray-50">
        {formatButton(<Bold className="w-4 h-4" />, 'bold', undefined, 'Bold (Ctrl+B)')}
        {formatButton(<Italic className="w-4 h-4" />, 'italic', undefined, 'Italic (Ctrl+I)')}
        {formatButton(<Underline className="w-4 h-4" />, 'underline', undefined, 'Underline (Ctrl+U)')}

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {formatButton(<Heading1 className="w-4 h-4" />, 'formatBlock', '<h1>', 'Heading 1')}
        {formatButton(<Heading2 className="w-4 h-4" />, 'formatBlock', '<h2>', 'Heading 2')}
        {formatButton(<Heading3 className="w-4 h-4" />, 'formatBlock', '<h3>', 'Heading 3')}

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {formatButton(<List className="w-4 h-4" />, 'insertUnorderedList', undefined, 'Bullet List')}
        {formatButton(<ListOrdered className="w-4 h-4" />, 'insertOrderedList', undefined, 'Numbered List')}

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {formatButton(<AlignLeft className="w-4 h-4" />, 'justifyLeft', undefined, 'Align Left')}
        {formatButton(<AlignCenter className="w-4 h-4" />, 'justifyCenter', undefined, 'Align Center')}
        {formatButton(<AlignRight className="w-4 h-4" />, 'justifyRight', undefined, 'Align Right')}

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-100 rounded transition-colors text-gray-700 hover:text-gray-900"
          title="Insert Link"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Link className="w-4 h-4" />
        </button>

        {formatButton(<Code className="w-4 h-4" />, 'formatBlock', '<pre>', 'Code Block')}
      </div>

      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="p-4 outline-none text-gray-900 prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          position: absolute;
        }
        [contenteditable] {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        [contenteditable] h1 {
          font-size: 2em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] h3 {
          font-size: 1.25em;
          font-weight: bold;
          margin: 0.5em 0;
        }
        [contenteditable] ul, [contenteditable] ol {
          margin-left: 1.5em;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: monospace;
        }
        [contenteditable] a {
          color: #2563eb;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
