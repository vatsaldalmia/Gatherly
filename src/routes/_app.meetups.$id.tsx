import { createFileRoute, Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FairnessScore } from "@/components/fairness-score";
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Route as RouteIcon,
  Share2,
  Vote,
  Sparkles,
  CheckCircle2,
  Hourglass,
  Trophy,
  Users,
  Copy,
  MessageCircle,
  Trash2,
  Pencil,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { getMyParticipantId, type MeetupStatus } from "@/lib/meetup-store";
import { getTravelDistances } from "@/lib/api/places.functions";
import { useMeetupQuery, useCastVote, useRemoveVote, useCalculateAreas, useFinalizeMeetup, useDeleteMeetup, useMeetupsListQuery, useUpdateParticipant, useParticipantJoinNotifications } from "@/lib/api/hooks";
import { useSession } from "@/lib/auth/auth-client";
import { ShareMeetupDialog } from "@/components/share-meetup-dialog";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import type { MeetupParticipant, BestArea } from "@/components/MeetupMap";

const MeetupMap = lazy(() => import("@/components/MeetupMap").then((m) => ({ default: m.MeetupMap })));

function shortAddr(addr: string) {
  const first = addr.split(",")[0].trim();
  return first.length > 22 ? first.slice(0, 20) + "…" : first;
}

function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(x));
}

// Radius (m) that covers every participant from the given area, so the venue
// search spans the whole group's neighbourhoods — not just a bubble at the
// midpoint. Adds a 1.5 km cushion and clamps to Google Places' 50 km max.
function coverageRadius(
  area: { lat: number; lng: number },
  participants: { lat: number; lng: number }[],
) {
  if (participants.length === 0) return 2000;
  const farthest = Math.max(...participants.map((p) => haversineMeters(area, p)));
  return Math.min(50000, Math.round(farthest + 1500));
}

export const Route = createFileRoute("/_app/meetups/$id")({
  head: () => ({ meta: [{ title: "Meetup — Gatherly" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    created: s.created === 1 || s.created === "1" ? 1 : undefined,
  }),
  component: MeetupResults,
});

const statusMeta: Record<MeetupStatus, { label: string; icon: typeof Hourglass; cls: string }> = {
  waiting: { label: "Waiting for participants", icon: Hourglass, cls: "bg-muted text-foreground" },
  ready: { label: "Ready for calculation", icon: Sparkles, cls: "bg-primary/10 text-primary" },
  voting: { label: "Voting in progress", icon: Vote, cls: "bg-mint/20 text-mint" },
  finalized: { label: "Meetup finalized", icon: Trophy, cls: "bg-mint text-mint-foreground" },
};

function MeetupResults() {
  const { id } = useParams({ from: "/_app/meetups/$id" });
  const search = useSearch({ from: "/_app/meetups/$id" });
  const navigate = useNavigate();
  const { data: meetup, isLoading, isFetching } = useMeetupQuery(id);
  const { data: session } = useSession();
  const { data: myMeetups = [] } = useMeetupsListQuery();

  // The host sits on this page after sharing the link, so joiners must announce themselves.
  useParticipantJoinNotifications(meetup);

  const castVoteMutation = useCastVote();
  const removeVoteMutation = useRemoveVote();
  const calculateAreasMutation = useCalculateAreas();
  const finalizeMutation = useFinalizeMeetup();
  const deleteMutation = useDeleteMeetup();
  const updateParticipantMutation = useUpdateParticipant();

  const [shareOpen, setShareOpen] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);


  const [editingAddress, setEditingAddress] = useState(false);
  const [editAddr, setEditAddr] = useState("");
  const [editTransport, setEditTransport] = useState("");

  useEffect(() => {
    if (search.created) setShareOpen(true);
  }, [search.created]);

  useEffect(() => {
    if (meetup?.status === "voting" || meetup?.status === "finalized") setShowRecs(true);
  }, [meetup?.status]);

  const myId = id ? getMyParticipantId(id) : null;
  // isHost: reliable check — listMeetups is auth-gated and only returns the user's own meetups
  const isHost = myMeetups.some((m) => m.id === id) || (!!session?.user && meetup?.hostUserId === session.user.id);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      navigate({ to: "/meetups" });
      toast.success("Meetup deleted.");
    } catch {
      toast.error("Failed to delete meetup.");
    }
  };

  // Areas sorted by fairness score (from DB, not dummy data)
  const ranked = useMemo(() => {
    if (!meetup?.areas) return [];
    return [...meetup.areas].sort((a, b) => b.fairnessScore - a.fairnessScore);
  }, [meetup?.areas]);

  // Participant coordinates — used to size the venue search radius so it covers
  // everyone's neighbourhoods, not just a bubble around the chosen area.
  const participantCoords = useMemo(
    () =>
      (meetup?.participants ?? [])
        .filter((p) => p.lat != null && p.lng != null)
        .map((p) => ({ lat: p.lat!, lng: p.lng! })),
    [meetup?.participants],
  );

  // The viewing user's own participant coords + transport — passed to the venues
  // page so each venue can show real "X km from you" (road distance) via their mode.
  const me = useMemo(
    () =>
      (meetup?.participants ?? []).find(
        (p) => p.id === myId || (!!session?.user && p.userId === session.user.id),
      ),
    [meetup?.participants, myId, session?.user],
  );
  const myCoords = useMemo(
    () => (me?.lat != null && me?.lng != null ? { lat: me.lat, lng: me.lng } : null),
    [me],
  );
  const myMode = me?.transport;

  // Real road distance/time from the viewing user to each recommended area, via
  // Google Distance Matrix — keyed by area id. Falls back to null (then straight
  // line) when unavailable.
  const areaIdsKey = ranked.map((a) => a.id).join(",");
  const { data: areaTravel } = useQuery({
    queryKey: ["area-travel", myCoords?.lat, myCoords?.lng, myMode, areaIdsKey],
    enabled: !!myCoords && ranked.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const res = await getTravelDistances({
        data: {
          origin: { lat: myCoords!.lat, lng: myCoords!.lng },
          mode: myMode ?? "driving",
          destinations: ranked.map((a) => ({ lat: a.lat, lng: a.lng })),
        },
      });
      const map: Record<string, { meters: number; seconds: number }> = {};
      ranked.forEach((a, i) => {
        const r = res[i];
        if (r) map[a.id] = r;
      });
      return map;
    },
  });

  // Close-knit group: the engine returns a single "central area" when everyone
  // is within 5 km, instead of a grid of fair-midpoint candidates. A spread-out
  // group always yields multiple ranked areas, so count is a reliable signal.
  const isCloseGroup = ranked.length === 1;

  // Total vote count
  const totalVotes = meetup?.votes?.length ?? 0;

  // Winner: area with the most votes
  const winner = useMemo(() => {
    if (!meetup || !meetup.votes?.length) return null;
    const countByArea = new Map<string, number>();
    for (const v of meetup.votes) {
      countByArea.set(v.areaId, (countByArea.get(v.areaId) ?? 0) + 1);
    }
    let bestId = "";
    let bestCount = 0;
    for (const [areaId, count] of countByArea) {
      if (count > bestCount) { bestId = areaId; bestCount = count; }
    }
    return meetup.areas?.find((a) => a.id === bestId) ?? null;
  }, [meetup]);

  // Best area for venue recommendations: finalized > vote winner > highest fairness.
  const bestArea = useMemo(() => {
    if (!meetup) return null;
    const finalized = meetup.finalizedAreaId
      ? meetup.areas?.find((a) => a.id === meetup.finalizedAreaId)
      : null;
    return finalized ?? winner ?? ranked[0] ?? null;
  }, [meetup, winner, ranked]);

  if (isLoading) {
    return (
      <>
        <AppTopbar title="Meetup" />
        <main className="flex-1 grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </>
    );
  }

  if (!meetup) {
    return (
      <>
        <AppTopbar title="Meetup" />
        <main className="flex-1 grid place-items-center px-4 py-20">
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-semibold">Meetup not found</h2>
            <p className="text-muted-foreground mt-2">It may have been deleted or never existed.</p>
            <Button asChild className="mt-6"><Link to="/meetups">Back to meetups</Link></Button>
          </div>
        </main>
      </>
    );
  }

  const statusInfo = statusMeta[meetup.status as MeetupStatus];
  const StatusIcon = statusInfo.icon;
  const canCalc = meetup.participants.length >= 2;
  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/meetup/${meetup.id}` : `/meetup/${meetup.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!");
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const findBestArea = async () => {
    if (!canCalc) return;
    try {
      await calculateAreasMutation.mutateAsync(meetup.id);
      setShowRecs(true);
      toast.success("Recommendations ready — share so the group can vote!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : null;
      toast.error(msg ?? "Failed to calculate areas. Check that all participants have valid addresses.");
    }
  };

  const vote = async (areaId: string, areaName: string, alreadyVoted: boolean) => {
    if (!myId) {
      toast.error("Join the meetup first to cast a vote.");
      return;
    }
    try {
      if (alreadyVoted) {
        await removeVoteMutation.mutateAsync({ meetupId: meetup.id, participantId: myId });
        toast.success("Vote removed.");
      } else {
        await castVoteMutation.mutateAsync({ meetupId: meetup.id, areaId, participantId: myId });
        toast.success(`Voted for ${areaName}`);
      }
    } catch {
      toast.error(alreadyVoted ? "Failed to remove vote" : "Failed to cast vote");
    }
  };

  const finalize = async () => {
    if (!winner) {
      toast.error("No votes yet");
      return;
    }
    try {
      await finalizeMutation.mutateAsync({ meetupId: meetup.id, areaId: winner.id });
      toast.success(`Finalized: ${winner.name}`);
    } catch {
      toast.error("Failed to finalize");
    }
  };

  const finalizedAreaName = meetup.finalizedAreaId
    ? meetup.areas?.find((a) => a.id === meetup.finalizedAreaId)?.name
    : null;

  return (
    <>
      <AppTopbar title={meetup.name} />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/meetups"><ArrowLeft className="h-4 w-4 mr-1.5" /> All meetups</Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", statusInfo.cls)}>
              <StatusIcon className="h-3.5 w-3.5" /> {statusInfo.label}
            </div>
            {isHost && !confirmDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/40 hover:bg-destructive/10"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            )}
            {isHost && confirmDelete && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Are you sure?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={handleDelete}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, delete"}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* min-w-0 on the columns: grid items default to min-width:auto, so a single long
            unbreakable string (the invite URL) would otherwise force the column wider than
            the viewport and scroll the whole page sideways on a phone. */}
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            <section className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0 w-full sm:w-auto sm:flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Share to invite</p>
                  {/* break-all, not truncate: the URL has no break opportunities, so nowrap
                      would make it demand its full width and overflow the card on a phone. */}
                  <p className="font-mono text-sm mt-1 break-all sm:truncate">{shareUrl}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={copyLink}>
                    <Copy className="h-3.5 w-3.5 mr-1.5" /> Copy
                  </Button>
                  <Button asChild size="sm" className="bg-mint text-mint-foreground hover:bg-mint/90">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Join "${meetup.name}" on Gatherly: ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> WhatsApp
                    </a>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShareOpen(true)}>
                    <Share2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
              {/* Real map */}
              {(() => {
                const mapParticipants: MeetupParticipant[] = meetup.participants
                  .filter((p) => p.lat != null && p.lng != null)
                  .map((p) => ({ id: p.id, name: p.name, lat: p.lat!, lng: p.lng!, address: p.address }));

                const topArea = ranked[0];
                const bestArea: BestArea | undefined = topArea
                  ? { lat: topArea.lat, lng: topArea.lng, name: topArea.name }
                  : undefined;

                return (
                  <Suspense fallback={<div className="h-72 sm:h-80 bg-muted/40 animate-pulse" />}>
                    <MeetupMap participants={mapParticipants} bestArea={bestArea} height="h-72 sm:h-80" />
                  </Suspense>
                );
              })()}
              <div className="p-5 sm:p-6 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {isCloseGroup ? "Central spot" : "Top pick"}
                  </p>
                  <h3 className="text-xl font-semibold mt-1">{ranked[0]?.name ?? "—"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {isCloseGroup
                      ? "Everyone's within 5 km — browse places anywhere around here"
                      : `Highest fairness score · ${ranked.length} areas found`}
                  </p>
                </div>
                <FairnessScore value={ranked[0]?.fairnessScore ?? 0} size="lg" />
              </div>
            </section>

            {!showRecs ? (
              <section className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 grid place-items-center">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Find the fairest area</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                    {canCalc
                      ? "Everyone's in — let's calculate the best meetup spots using real travel times."
                      : `Need ${2 - meetup.participants.length} more participant${2 - meetup.participants.length === 1 ? "" : "s"} before we can calculate.`}
                  </p>
                </div>
                <Button
                  disabled={!canCalc || calculateAreasMutation.isPending}
                  onClick={findBestArea}
                  className="bg-gradient-primary shadow-elegant hover:opacity-90"
                >
                  {calculateAreasMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calculating…</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Find best area</>
                  )}
                </Button>
              </section>
            ) : (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recommended areas</h3>
                  {meetup.status === "voting" && winner && (
                    <Button size="sm" variant="outline" onClick={finalize} disabled={finalizeMutation.isPending}>
                      <Trophy className="h-3.5 w-3.5 mr-1.5" /> Finalize {winner.name}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {ranked.map((a) => {
                    const voterIds = meetup.votes?.filter((v) => v.areaId === a.id).map((v) => v.participantId) ?? [];
                    const myVote = myId ? voterIds.includes(myId) : false;
                    const isFinal = meetup.finalizedAreaId === a.id;
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          "p-5 rounded-2xl border bg-card shadow-card grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 items-center",
                          isFinal ? "border-mint" : "border-border",
                        )}
                      >
                        <FairnessScore value={a.fairnessScore} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">{a.name}</h4>
                            {isFinal && <Badge className="bg-mint text-mint-foreground border-0">Finalized</Badge>}
                            {!isFinal && a.fairnessScore >= 90 && (
                              <Badge className="bg-primary/10 text-primary border-0">Top pick</Badge>
                            )}
                            {voterIds.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {voterIds.length} vote{voterIds.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </div>
                          {a.description && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">{a.description}</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.avgTravelTimeMin} min avg</span>
                            <span className="flex items-center gap-1"><RouteIcon className="h-3 w-3" /> {a.avgDistanceKm} km avg</span>
                            {myCoords && (
                              <span className="flex items-center gap-1 text-primary font-medium">
                                <Navigation className="h-3 w-3" />
                                {(() => {
                                  const road = areaTravel?.[a.id];
                                  const km = road
                                    ? road.meters / 1000
                                    : haversineMeters(myCoords, { lat: a.lat, lng: a.lng }) / 1000;
                                  const distStr = km < 1 ? `${Math.round(km * 1000)} m from you` : `${km.toFixed(1)} km from you`;
                                  return road
                                    ? `${distStr} · ${Math.round(road.seconds / 60)} min`
                                    : distStr;
                                })()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link
                              to="/venues"
                              search={{ area: a.name, lat: a.lat, lng: a.lng, radius: coverageRadius(a, participantCoords), myLat: myCoords?.lat, myLng: myCoords?.lng, myMode }}
                            >
                              View venues
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            disabled={meetup.status === "finalized" || castVoteMutation.isPending || removeVoteMutation.isPending}
                            onClick={() => vote(a.id, a.name, myVote)}
                            className={cn(
                              myVote
                                ? "bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20"
                                : "bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90",
                            )}
                          >
                            {myVote ? (
                              <><Vote className="h-3.5 w-3.5 mr-1.5" /> Remove vote</>
                            ) : (
                              <><Vote className="h-3.5 w-3.5 mr-1.5" /> Vote</>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 min-w-0 lg:sticky lg:top-20">
            <section className="rounded-2xl border border-border bg-card shadow-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Participants ({meetup.participants.length})
                  <span
                    aria-hidden
                    title="Live — this list updates on its own"
                    className={cn(
                      "h-1.5 w-1.5 rounded-full bg-mint transition-opacity duration-500",
                      isFetching ? "opacity-100 animate-pulse" : "opacity-30",
                    )}
                  />
                </h3>
                {meetup.expectedCount && meetup.expectedCount > meetup.participants.length && (
                  <span className="text-xs text-muted-foreground">
                    {meetup.expectedCount - meetup.participants.length} pending
                  </span>
                )}
              </div>
              {meetup.expectedCount && meetup.expectedCount > 0 && (
                <Progress
                  value={(meetup.participants.length / Math.max(meetup.expectedCount, meetup.participants.length)) * 100}
                  className="mt-3 h-2"
                />
              )}
              <div className="mt-4 space-y-3">
                {meetup.participants.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground">No one's joined yet.</p>
                    <Button size="sm" variant="link" onClick={() => setShareOpen(true)}>
                      Share the link
                    </Button>
                  </div>
                )}
                {meetup.participants.map((m) => {
                  const isMe = m.id === myId;
                  if (isMe && editingAddress) {
                    return (
                      <div key={m.id} className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
                        <p className="text-xs font-medium text-primary">Update your info</p>
                        <AddressAutocomplete
                          value={editAddr}
                          onChange={setEditAddr}
                          onSelect={(desc) => setEditAddr(desc)}
                          placeholder="Your address"
                          className="h-9 text-sm"
                        />
                        <select
                          value={editTransport}
                          onChange={(e) => setEditTransport(e.target.value)}
                          className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {["car", "metro", "bus", "train", "taxi", "bicycle", "2-wheeler", "auto", "walking"].map((t) => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 h-8 bg-gradient-primary text-primary-foreground hover:opacity-90"
                            disabled={updateParticipantMutation.isPending || !editAddr.trim()}
                            onClick={async () => {
                              try {
                                await updateParticipantMutation.mutateAsync({
                                  participantId: m.id,
                                  meetupId: meetup.id,
                                  address: editAddr,
                                  transport: editTransport as never,
                                });
                                setEditingAddress(false);
                                // Re-run area calculation if areas were already computed
                                if (ranked.length > 0) {
                                  toast.promise(
                                    calculateAreasMutation.mutateAsync(meetup.id).then(() => setShowRecs(true)),
                                    {
                                      loading: "Address updated — recalculating areas…",
                                      success: "Areas updated with your new address!",
                                      error: "Address saved. Ask the host to recalculate areas.",
                                    },
                                  );
                                } else {
                                  toast.success("Address updated!");
                                }
                              } catch {
                                toast.error("Failed to update address.");
                              }
                            }}
                          >
                            {updateParticipantMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditingAddress(false)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar ?? undefined} />
                        <AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}{isMe && <span className="ml-1 text-xs text-muted-foreground">(you)</span>}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {shortAddr(m.address)}
                        </p>
                      </div>
                      {isMe ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditAddr(m.address);
                            setEditTransport(m.transport);
                            setEditingAddress(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-xs gap-1">
                          <CheckCircle2 className="h-3 w-3 text-mint" /> Joined
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card shadow-card p-5">
              <h3 className="font-semibold">Live vote tally</h3>
              {totalVotes === 0 ? (
                <p className="text-sm text-muted-foreground mt-4">
                  No votes yet. {showRecs ? "Cast the first one!" : "Calculate areas to start voting."}
                </p>
              ) : (
                <div className="mt-4 space-y-4">
                  {ranked.map((a) => {
                    const count = meetup.votes?.filter((v) => v.areaId === a.id).length ?? 0;
                    if (count === 0) return null;
                    const pct = Math.round((count / totalVotes) * 100);
                    return (
                      <div key={a.id}>
                        <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-1.5">
                            {winner?.id === a.id && <Trophy className="h-3.5 w-3.5 text-mint" />}
                            {a.name}
                          </span>
                          <span className="text-muted-foreground">{count} · {pct}%</span>
                        </div>
                        <Progress value={pct} className="mt-1.5 h-2" />
                      </div>
                    );
                  })}
                </div>
              )}
              {meetup.status === "finalized" && finalizedAreaName && (
                <p className="text-xs text-mint mt-4 flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Finalized: {finalizedAreaName}
                </p>
              )}
            </section>

            <Button size="lg" className="w-full bg-gradient-primary shadow-elegant hover:opacity-90" asChild>
              {bestArea ? (
                <Link
                  to="/venues"
                  search={{ area: bestArea.name, lat: bestArea.lat, lng: bestArea.lng, radius: coverageRadius(bestArea, participantCoords), myLat: myCoords?.lat, myLng: myCoords?.lng, myMode }}
                >
                  <MapPin className="h-4 w-4 mr-2" /> Browse venues near {bestArea.name}
                </Link>
              ) : (
                <Link to="/venues" search={{ area: undefined, lat: undefined, lng: undefined, radius: undefined, myLat: myCoords?.lat, myLng: myCoords?.lng, myMode }}>
                  <MapPin className="h-4 w-4 mr-2" /> Browse venues
                </Link>
              )}
            </Button>
          </aside>
        </div>

        <ShareMeetupDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          meetupId={meetup.id}
          meetupName={meetup.name}
        />
      </main>
    </>
  );
}
