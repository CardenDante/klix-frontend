// src/components/shared/TiptapEditor.tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Strikethrough,
  Italic,
  List,
  ListOrdered,
  Heading2,
} from "lucide-react"

const TiptapEditor = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (richText: string) => void;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
            HTMLAttributes: {
                class: 'list-disc pl-4'
            }
        },
        orderedList: {
            HTMLAttributes: {
                class: 'list-decimal pl-4'
            }
        }
      }),
      Placeholder.configure({
        placeholder: 'Tell your attendees all about the event...',
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "rounded-md border min-h-[150px] border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  return (
    <div className="flex flex-col gap-2">
       <div className="border border-input rounded-md p-2 flex items-center gap-1">
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleBold().run()
                }}
                className={`p-2 rounded-md ${editor?.isActive("bold") ? "bg-primary text-white" : "hover:bg-gray-100"}`}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleItalic().run()
                }}
                className={`p-2 rounded-md ${editor?.isActive("italic") ? "bg-primary text-white" : "hover:bg-gray-100"}`}
            >
                <Italic className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleStrike().run()
                }}
                 className={`p-2 rounded-md ${editor?.isActive("strike") ? "bg-primary text-white" : "hover:bg-gray-100"}`}
            >
                <Strikethrough className="w-4 h-4" />
            </button>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleBulletList().run()
                }}
                 className={`p-2 rounded-md ${editor?.isActive("bulletList") ? "bg-primary text-white" : "hover:bg-gray-100"}`}
            >
                <List className="w-4 h-4" />
            </button>
             <button
                onClick={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleOrderedList().run()
                }}
                 className={`p-2 rounded-md ${editor?.isActive("orderedList") ? "bg-primary text-white" : "hover:bg-gray-100"}`}
            >
                <ListOrdered className="w-4 h-4" />
            </button>
        </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default TiptapEditor