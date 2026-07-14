import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listMeetups, getMeetup, createMeetup, deleteMeetup } from "./meetups.functions";
import { addParticipant, updateParticipant, leaveMeetup, claimParticipant } from "./participants.functions";
import { castVote, removeVote, finalizeMeetup } from "./votes.functions";
import { calculateAreas } from "./fairness.functions";

// Centralised query key factory — consistent cache invalidation
export const meetupKeys = {
  all: ["meetups"] as const,
  list: () => [...meetupKeys.all, "list"] as const,
  detail: (id: string) => [...meetupKeys.all, "detail", id] as const,
};

export function useMeetupsListQuery() {
  return useQuery({
    queryKey: meetupKeys.list(),
    queryFn: () => listMeetups(),
    staleTime: 30_000,
  });
}

export function useMeetupQuery(id: string | undefined) {
  return useQuery({
    queryKey: meetupKeys.detail(id!),
    queryFn: () => getMeetup({ data: { id: id! } }),
    enabled: !!id,
    staleTime: 5_000,
    // A meetup is shared by link and edited by several people at once, so the copy on
    // screen goes stale on its own — nobody on this tab has to act for it to change.
    // Poll until WebSockets are added, and catch up immediately when the tab regains
    // focus or the network returns, which is when a host actually looks at the page.
    refetchInterval: 10_000,
    refetchIntervalInBackground: false, // a hidden tab has nobody to show updates to
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

type LiveParticipant = { id: string; name: string };

/**
 * Announces people who appear between polls of a meetup already on screen.
 *
 * The detail query refreshes itself, so joiners land in the participant list silently —
 * the host is given no reason to look back at a list they have already read. This diffs
 * each refetch against the participants this tab has already seen and surfaces the new
 * ones, so sharing the link produces visible arrivals rather than a number that quietly
 * changes when nobody is looking.
 */
export function useParticipantJoinNotifications(
  meetup: { id: string; participants: LiveParticipant[] } | undefined,
) {
  const qc = useQueryClient();
  // Which meetup `seen` describes; a different id means a fresh baseline, not new joins.
  const seenFor = useRef<string | null>(null);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!meetup) return;

    // First sight of this meetup: everyone already there is history, not an arrival.
    if (seenFor.current !== meetup.id) {
      seenFor.current = meetup.id;
      seen.current = new Set(meetup.participants.map((p) => p.id));
      return;
    }

    const arrived = meetup.participants.filter((p) => !seen.current.has(p.id));
    if (arrived.length === 0) return;
    for (const p of arrived) seen.current.add(p.id);

    const names = arrived.map((p) => p.name);
    toast.success(names.length === 1 ? `${names[0]} joined` : `${names.length} people joined`, {
      description: names.length > 1 ? names.join(", ") : "They're on the map now.",
      icon: "👋",
    });

    // The list view shows participant counts, so it is stale the moment this fires.
    qc.invalidateQueries({ queryKey: meetupKeys.list() });
  }, [meetup, qc]);
}

export function useCreateMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof createMeetup>[0]["data"]) =>
      createMeetup({ data: input }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meetupKeys.list() }),
  });
}

export function useDeleteMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMeetup({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: meetupKeys.list() }),
  });
}

export function useAddParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof addParticipant>[0]["data"]) =>
      addParticipant({ data: input }),
    // Joining changes the participant count the list view renders, not just the detail.
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) });
      qc.invalidateQueries({ queryKey: meetupKeys.list() });
    },
  });
}

/**
 * Retroactively links a participant row to the signed-in user's account, so a meetup joined
 * as a guest — the common order, since the invite works with no account — starts showing up
 * in "active meetups" the moment its joiner has one.
 *
 * Fires once per meetup, only when there's someone to link: a session, a participant this
 * browser remembers as "me" (see getMyParticipantId), and that row not already tied to an
 * account. On success it invalidates the list query, so the sidebar/dashboard picks the
 * meetup up without a manual refresh.
 */
export function useAutoClaimParticipant(
  meetup: { id: string; participants: { id: string; userId?: string | null }[] } | undefined,
  myId: string | null,
  hasSession: boolean,
) {
  const qc = useQueryClient();
  const claimedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!meetup || !myId || !hasSession) return;
    if (claimedFor.current === meetup.id) return;
    const mine = meetup.participants.find((p) => p.id === myId);
    if (!mine || mine.userId) return;

    claimedFor.current = meetup.id;
    claimParticipant({ data: { meetupId: meetup.id, participantId: myId } }).then((result) => {
      if (result.ok) {
        qc.invalidateQueries({ queryKey: meetupKeys.detail(meetup.id) });
        qc.invalidateQueries({ queryKey: meetupKeys.list() });
      }
    });
  }, [meetup, myId, hasSession, qc]);
}

export function useLeaveMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof leaveMeetup>[0]["data"]) => leaveMeetup({ data: input }),
    // Leaving changes the participant count and can send the meetup back to "waiting", both of
    // which the list view renders.
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) });
      qc.invalidateQueries({ queryKey: meetupKeys.list() });
    },
  });
}

export function useUpdateParticipant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof updateParticipant>[0]["data"]) =>
      updateParticipant({ data: input }),
    onSuccess: async (result, vars) => {
      // Check cache before invalidation to see if areas already exist
      const cached = qc.getQueryData<Awaited<ReturnType<typeof getMeetup>>>(
        meetupKeys.detail(vars.meetupId),
      );
      const hasAreas = (cached?.areas?.length ?? 0) > 0;
      const hasCoords = result.lat != null && result.lng != null;

      await qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) });

      if (hasAreas && hasCoords) {
        try {
          await calculateAreas({ data: { meetupId: vars.meetupId } });
          await qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) });
        } catch {
          // Best-effort
        }
      }
    },
  });
}

export function useCastVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof castVote>[0]["data"]) => castVote({ data: input }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useRemoveVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof removeVote>[0]["data"]) => removeVote({ data: input }),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) }),
  });
}

export function useCalculateAreas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meetupId: string) => calculateAreas({ data: { meetupId } }),
    onSuccess: (_, meetupId) => qc.invalidateQueries({ queryKey: meetupKeys.detail(meetupId) }),
  });
}

export function useFinalizeMeetup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof finalizeMeetup>[0]["data"]) =>
      finalizeMeetup({ data: input }),
    // Finalizing flips the status badge the list view renders.
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: meetupKeys.detail(vars.meetupId) });
      qc.invalidateQueries({ queryKey: meetupKeys.list() });
    },
  });
}
