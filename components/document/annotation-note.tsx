import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Trash, Edit } from "lucide-react";
import { useState } from "react";

interface AnnotationNoteProps {
  content: string;
  onSave: (content: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function AnnotationNote({
  content,
  onSave,
  onDelete,
  onClose,
}: AnnotationNoteProps) {
  const [isEditing, setIsEditing] = useState(!content);
  const [noteContent, setNoteContent] = useState(content);

  const handleSave = () => {
    onSave(noteContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (!content) {
      onClose();
    } else {
      setNoteContent(content);
      setIsEditing(false);
    }
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 p-4 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Annotation Note</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isEditing ? (
        <>
          <Textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Enter your note..."
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </>
      ) : (
        <>
          <p className="mb-4">{noteContent}</p>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </>
      )}
    </Card>
  );
} 