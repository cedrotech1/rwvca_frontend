import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { isSafeUrl, sanitizeHtml, stripClipboardArtifacts } from '../utils/sanitize';
import { 
  Bold,
  Italic, 
  Underline as UnderlineIcon,
  List, 
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  Link as LinkIcon,
  Highlighter,
  Strikethrough
} from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder = "Start writing your report..." }) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [selectedHighlightColor, setSelectedHighlightColor] = useState('#ffff00');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        validate: (href) => isSafeUrl(href),
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
          rel: 'noopener noreferrer',
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor mx-auto focus:outline-none min-h-[300px] p-4 prose prose-sm max-w-none',
      },
      transformPastedHTML: (html) => sanitizeHtml(html),
      transformPastedText: (text) => stripClipboardArtifacts(text),
    },
  });

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 rounded-lg h-64"></div>;
  }

  // Helper functions
  const addLink = () => {
    if (linkUrl && isSafeUrl(linkUrl)) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
  };

  const setHighlightColor = (color) => {
    setSelectedHighlightColor(color);
    editor.chain().focus().setHighlight({ color }).run();
  };

  
  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bold') ? 'bg-gray-200' : ''
              }`}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('italic') ? 'bg-gray-200' : ''
              }`}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('underline') ? 'bg-gray-200' : ''
              }`}
              title="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('strike') ? 'bg-gray-200' : ''
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('code') ? 'bg-gray-200' : ''
              }`}
              title="Inline Code"
            >
              <Code className="h-4 w-4" />
            </button>
          </div>

          {/* Headings */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''
              }`}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''
              }`}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('heading', { level: 3 }) ? 'bg-gray-200' : ''
              }`}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('bulletList') ? 'bg-gray-200' : ''
              }`}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('orderedList') ? 'bg-gray-200' : ''
              }`}
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('blockquote') ? 'bg-gray-200' : ''
              }`}
              title="Quote"
            >
              <Quote className="h-4 w-4" />
            </button>
          </div>

          {/* Links and Colors */}
          <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
            <button
              type="button"
              onClick={() => {
                if (editor.isActive('link')) {
                  removeLink();
                } else {
                  setShowLinkDialog(true);
                }
              }}
              className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                editor.isActive('link') ? 'bg-blue-200' : ''
              }`}
              title={editor.isActive('link') ? 'Remove Link' : 'Add Link'}
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <div className="flex gap-1">
              <span className="flex items-center text-xs text-gray-600 mr-1">Highlight:</span>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHighlight().run()}
                className={`p-2 rounded hover:bg-gray-200 transition-colors ${
                  editor.isActive('highlight') ? 'bg-yellow-200' : ''
                }`}
                title="Highlight"
              >
                <Highlighter className="h-4 w-4" />
              </button>
              {/* Color Options */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setHighlightColor('#ffff00')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-yellow-400 hover:border-gray-400`}
                  title="Yellow"
                  style={{ backgroundColor: '#ffff00' }}
                />
                <button
                  type="button"
                  onClick={() => setHighlightColor('#00ff00')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-green-400 hover:border-gray-400`}
                  title="Green"
                  style={{ backgroundColor: '#00ff00' }}
                />
                <button
                  type="button"
                  onClick={() => setHighlightColor('#ff0000')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-red-400 hover:border-gray-400`}
                  title="Red"
                  style={{ backgroundColor: '#ff0000' }}
                />
                <button
                  type="button"
                  onClick={() => setHighlightColor('#00ffff')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-cyan-400 hover:border-gray-400`}
                  title="Cyan"
                  style={{ backgroundColor: '#00ffff' }}
                />
                <button
                  type="button"
                  onClick={() => setHighlightColor('#ff00ff')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-purple-400 hover:border-gray-400`}
                  title="Purple"
                  style={{ backgroundColor: '#ff00ff' }}
                />
                <button
                  type="button"
                  onClick={() => setHighlightColor('#ffa500')}
                  className={`w-6 h-6 rounded border-2 border-gray-300 bg-orange-400 hover:border-gray-400`}
                  title="Orange"
                  style={{ backgroundColor: '#ffa500' }}
                />
              </div>
            </div>
          </div>

          
          {/* History */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-2 rounded hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="absolute z-10 bg-white border border-gray-300 rounded-lg shadow-lg p-4 mt-2">
          <h3 className="text-sm font-medium mb-2">Add Link</h3>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addLink}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLinkDialog(false);
                setLinkUrl('');
              }}
              className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className="bg-white relative">
        <EditorContent editor={editor} />
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-500 flex justify-between">
        <span>🔗 Links & � Highlights Only!</span>
        <span>✨ Clean & Simple</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
