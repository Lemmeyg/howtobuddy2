import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Highlighter, StickyNote, Trash } from "lucide-react";

interface AnnotationToolbarProps {
  onAddAnnotation: (type: "highlight" | "note") => void;
  onDeleteAnnotation: () => void;
  hasSelectedAnnotation: boolean;
}

export function AnnotationToolbar({
  onAddAnnotation,
  onDeleteAnnotation,
  hasSelectedAnnotation,
}: AnnotationToolbarProps) {
  return (
    <div className="flex items-center space-x-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Highlighter className="w-4 h-4 mr-2" />
            Add Annotation
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => onAddAnnotation("highlight")}>
            <Highlighter className="w-4 h-4 mr-2" />
            Highlight
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddAnnotation("note")}>
            <StickyNote className="w-4 h-4 mr-2" />
            Note
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {hasSelectedAnnotation && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeleteAnnotation}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash className="w-4 h-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  );
} 