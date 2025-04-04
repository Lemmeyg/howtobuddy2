"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading2,
  Undo,
  Redo,
  Save
} from 'lucide-react';
import { Toggle } from "@/components/ui/toggle";
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useParams } from "next/navigation";

interface EditorProps {
  content: string;
  onSave?: (content: string) => void;
}

export function DocumentEditor({ content, onSave }: EditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const params = useParams();

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editor.getHTML(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save document');
      }

      toast({
        title: "Success",
        description: "Document saved successfully",
      });

      if (onSave) {
        onSave(editor.getHTML());
      }
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save document",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background sticky top-0 z-10">
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('heading')}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Toggle>

        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <div className="border rounded-lg p-4 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
} 