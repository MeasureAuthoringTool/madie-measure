import './RichTextEditor.scss'
import React, { useEffect, useState, useMemo } from 'react'

import { EditorContent, EditorProvider, useEditor } from '@tiptap/react'
import { generateHTML } from '@tiptap/react'

import Gapcursor from '@tiptap/extension-gapcursor'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'

const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }
  return (
    <div className="control-group">
      <div className="button-group">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
          Bold
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
          Italic
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? 'is-active' : ''}>
          Strike
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? 'is-active' : ''}>
          Toggle bullet list
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
          Toggle ordered list
        </button>
        <button type="button" onClick={() => editor.commands.insertTable({ rows: 3, cols: 3, withHeaderRow: true })} className={editor.isActive('orderedList') ? 'is-active' : ''}>
          Insert table
        </button>
        <button type="button" onClick={() => editor.commands.addColumnBefore()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
          Add col
        </button>
        <button type="button" onClick={() => editor.commands.addRowBefore()} className={editor.isActive('orderedList') ? 'is-active' : ''}>
          add row
        </button>
      </div>
    </div>
  );
} 

export default ({ onChange, content  }) => {
    const editor = useEditor({
          extensions: [
            StarterKit,
            Gapcursor,
            Table.configure({
              resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
          ],
          shouldRerenderOnTransaction: false,
          content,
          onUpdate: ({ editor }) => {
              const newValue = editor.getHTML();
                onChange(newValue)
            },
        },
      [content])
  return (
    <>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </>
  )
}
