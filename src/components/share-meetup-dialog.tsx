import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, MessageCircle, ExternalLink, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ShareMeetupDialog({
  open,
  onOpenChange,
  meetupId,
  meetupName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meetupId: string;
  meetupName: string;
}) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/meetup/${meetupId}`
      : `/meetup/${meetupId}`;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Long-press the link to copy manually.");
    }
  };

  const waUrl = `https://wa.me/?text=${encodeURIComponent(
    `You're invited to "${meetupName}" on Gatherly. Drop your location so we can find a fair spot: ${url}`,
  )}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-mint/20 grid place-items-center mb-2">
            <Check className="h-6 w-6 text-mint" />
          </div>
          <DialogTitle className="text-center text-xl">Meetup created</DialogTitle>
          <DialogDescription className="text-center">
            Share the link — friends can join in one tap, no account needed.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" size="icon" onClick={copy} aria-label="Copy link">
            {copied ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <DialogFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2">
          <Button asChild variant="outline" className="h-11">
            <a href={waUrl} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4 mr-2" /> Share via WhatsApp
            </a>
          </Button>
          <Button onClick={() => onOpenChange(false)} className="h-11 bg-gradient-primary shadow-elegant">
            <ExternalLink className="h-4 w-4 mr-2" /> Open meetup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}