import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteMeetup } from "@/lib/api/hooks";
import { cn } from "@/lib/utils";

type Props = {
  meetupId: string;
  meetupName: string;
  /** Render as a small icon button (for cards) instead of a full button. */
  variant?: "icon" | "button";
  className?: string;
};

/**
 * Self-contained delete control with a confirmation dialog.
 * Usable from list/dashboard cards without navigating into the meetup.
 */
export function DeleteMeetupButton({ meetupId, meetupName, variant = "icon", className }: Props) {
  const [open, setOpen] = useState(false);
  const deleteMutation = useDeleteMeetup();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(meetupId);
      toast.success("Meetup deleted.");
      setOpen(false);
    } catch {
      toast.error("Failed to delete meetup.");
    }
  };

  // Stop the click from bubbling to a parent <Link> card.
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {variant === "icon" ? (
        <button
          type="button"
          aria-label={`Delete ${meetupName}`}
          onClick={(e) => {
            stop(e);
            setOpen(true);
          }}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className={cn("text-destructive border-destructive/40 hover:bg-destructive/10", className)}
          onClick={(e) => {
            stop(e);
            setOpen(true);
          }}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
        </Button>
      )}

      <AlertDialogContent onClick={stop}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{meetupName}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the meetup along with its participants, areas, and votes. This can't be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={stop} disabled={deleteMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              stop(e);
              handleDelete();
            }}
            disabled={deleteMutation.isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Deleting…
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
