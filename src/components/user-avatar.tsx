import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { generatedAvatar, gravatarUrl, initialsOf } from "@/lib/avatar";
import { cn } from "@/lib/utils";

type Props = {
  name?: string | null;
  email?: string | null;
  /** The provider's photo, when there is one. Wins over everything else. */
  image?: string | null;
  /** Stable identity for the generated colour — a user or participant id. */
  seed?: string | null;
  className?: string;
  fallbackClassName?: string;
};

/**
 * One avatar for every surface: sidebar, topbar, profile, participant lists, join page.
 *
 * Resolves photo → Gravatar → generated colour (see lib/avatar.ts). Radix drives the last
 * step for free: when the image 404s or is absent it renders the fallback, which is where
 * the generated avatar lives.
 */
export function UserAvatar({ name, email, image, seed, className, fallbackClassName }: Props) {
  const identity = seed || email || name || "anonymous";
  const gravatar = useGravatar(image ? null : email);
  const src = image ?? gravatar ?? undefined;

  return (
    <Avatar className={className}>
      <AvatarImage src={src} alt={name ?? "Profile picture"} />
      <AvatarFallback
        className={cn("text-white font-semibold", fallbackClassName)}
        style={generatedAvatar(identity)}
      >
        {initialsOf(name, email)}
      </AvatarFallback>
    </Avatar>
  );
}

/**
 * Gravatar's URL for `email`, once it has been hashed. Null while hashing, on the server, and
 * whenever there's no email — in each case the caller falls through to the generated avatar,
 * so there is never a gap where nothing renders.
 */
function useGravatar(email?: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      setUrl(null);
      return;
    }
    let active = true;
    gravatarUrl(email).then((resolved) => {
      if (active) setUrl(resolved);
    });
    return () => {
      active = false; // a fast switch between users must not land the old address
    };
  }, [email]);

  return url;
}
