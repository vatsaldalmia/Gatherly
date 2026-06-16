import { createFileRoute, Link, useParams, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppTopbar } from "@/components/app-topbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { FairnessScore } from "@/components/fairness-score";
import { areas } from "@/lib/dummy-data";
import {
  ArrowLeft,
  Clock,
  MapPin,
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
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  castVote,
  finalizeMeetup,
  getMyParticipantId,
  updateMeetup,
  useMeetup,
  type MeetupStatus,
} from "@/lib/meetup-store";
import { ShareMeetupDialog } from "@/components/share-meetup-dialog";

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
  const meetup = useMeetup(id);
  const [shareOpen, setShareOpen] = useState(false);
  const [showRecs, setShowRecs] = useState(false);

  useEffect(() => {
    if (search.created) setShareOpen(true);
  }, [search.created]);

  useEffect(() => {
    if (meetup?.status === "voting" || meetup?.status === "finalized") setShowRecs(true);
  }, [meetup?.status]);

  const myId = id ? getMyParticipantId(id) : null;

  const ranked = useMemo(() => {
    if (!meetup) return [] as typeof areas;
    return [...areas].sort((a, b) => b.fairness - a.fairness);
  }, [meetup]);

  const totalVotes = useMemo(() => {
    if (!meetup) return 0;
    return Object.values(meetup.votes ?? {}).reduce((s, arr) => s + arr.length, 0);
  }, [meetup]);

  const winner = useMemo(() => {
    if (!meetup) return null;
    let best: { name: string; count: number } | null = null;
    for (const [name, voters] of Object.entries(meetup.votes ?? {})) {
      if (!best || voters.length > best.count) best = { name, count: voters.length };
    }
    return best;
  }, [meetup]);

  if (!meetup) {
    return (
      <>
        <AppTopbar title="Meetup" />
        <main className="flex-1 grid place-items-center px-4 py-20">
          <div className="text-center max-w-sm">
            <h2 className="text-xl font-semibold">Meetup not found</h2>
            <p className="text-muted-foreground mt-2">It may have been deleted or never existed on this device.</p>
            <Button asChild className="mt-6"><Link to="/meetups">Back to meetups</Link></Button>
          </div>
        </main>
      </>
    );
  }

  const statusInfo = statusMeta[meetup.status];
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

  const findBestArea = () => {
    if (!canCalc) return;
    setShowRecs(true);
    updateMeetup(meetup.id, { status: "voting" });
    toast.success("Recommendations ready — share so the group can vote!");
  };

  const vote = (areaName: string) => {
    const voterId = myId ?? "host-self";
    castVote(meetup.id, areaName, voterId);
    toast.success(`Voted for ${areaName}`);
  };

  const finalize = () => {
    if (!winner) {
      toast.error("No votes yet");
      return;
    }
    finalizeMeetup(meetup.id, winner.name);
    toast.success(`Finalized: ${winner.name}`);
  };

  return (
    <>
      <AppTopbar title={meetup.name} />
      <main className="flex-1 px-4 sm:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/meetups"><ArrowLeft className="h-4 w-4 mr-1.5" /> All meetups</Link>
          </Button>
          <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", statusInfo.cls)}>
            <StatusIcon className="h-3.5 w-3.5" /> {statusInfo.label}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-6 items-start">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card shadow-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Share to invite</p>
                  <p className="font-mono text-sm mt-1 truncate">{shareUrl}</p>
                </div>
                <div className="flex gap-2">
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
              <div className="relative h-64 sm:h-80 bg-gradient-hero">
                <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px]" />
                <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 600 320">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeOpacity="0.15" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="600" height="320" fill="url(#grid)" />
                  <path d="M0 200 Q150 120 300 180 T600 140" stroke="white" strokeOpacity="0.4" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                  <path d="M80 50 Q200 220 380 90 T580 260" stroke="white" strokeOpacity="0.3" strokeWidth="2" fill="none" strokeDasharray="6 4" />
                </svg>
                {meetup.participants.slice(0, 6).map((m, i) => (
                  <div
                    key={m.id}
                    className="absolute"
                    style={{
                      left: `${12 + i * 14}%`,
                      top: `${25 + (i % 3) * 20}%`,
                    }}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-4 ring-white/30 shadow-elegant">
                        <AvatarImage src={m.avatar} />
                        <AvatarFallback>{m.name[0]}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-card text-[10px] font-medium border border-border">
                        {m.address.slice(0, 12)}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="h-14 w-14 rounded-full bg-mint grid place-items-center shadow-elegant ring-4 ring-white/50">
                    <MapPin className="h-6 w-6 text-mint-foreground" />
                  </div>
                  <p className="mt-2 text-xs text-white font-semibold text-center bg-black/40 backdrop-blur px-2 py-0.5 rounded-full">
                    {meetup.finalizedArea ?? (winner?.name ?? "Best area")}
                  </p>
                </div>
              </div>
              <div className="p-5 sm:p-6 flex flex-wrap gap-4 items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Top pick</p>
                  <h3 className="text-xl font-semibold mt-1">{ranked[0]?.name ?? "—"}</h3>
                  <p className="text-sm text-muted-foreground">Highest fairness score · 4 venues recommended</p>
                </div>
                <FairnessScore value={ranked[0]?.fairness ?? 0} size="lg" />
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
                      ? "Everyone's in — let's calculate the best meetup spots and open it up to votes."
                      : `Need ${2 - meetup.participants.length} more participant${2 - meetup.participants.length === 1 ? "" : "s"} before we can calculate.`}
                  </p>
                </div>
                <Button
                  disabled={!canCalc}
                  onClick={findBestArea}
                  className="bg-gradient-primary shadow-elegant hover:opacity-90"
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Find best area
                </Button>
              </section>
            ) : (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Recommended areas</h3>
                  {meetup.status === "voting" && winner && (
                    <Button size="sm" variant="outline" onClick={finalize}>
                      <Trophy className="h-3.5 w-3.5 mr-1.5" /> Finalize {winner.name}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {ranked.map((a) => {
                    const voters = meetup.votes?.[a.name] ?? [];
                    const myVote = myId ? voters.includes(myId) : voters.includes("host-self");
                    const isFinal = meetup.finalizedArea === a.name;
                    return (
                      <div
                        key={a.name}
                        className={cn(
                          "p-5 rounded-2xl border bg-card shadow-card grid grid-cols-[auto_minmax(0,1fr)_auto] gap-4 items-center",
                          isFinal ? "border-mint" : "border-border",
                        )}
                      >
                        <FairnessScore value={a.fairness} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">{a.name}</h4>
                            {isFinal && <Badge className="bg-mint text-mint-foreground border-0">Finalized</Badge>}
                            {!isFinal && a.fairness >= 90 && (
                              <Badge className="bg-primary/10 text-primary border-0">Top pick</Badge>
                            )}
                            {voters.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {voters.length} vote{voters.length === 1 ? "" : "s"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 truncate">{a.description}</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {a.travelTime} min avg</span>
                            <span className="flex items-center gap-1"><RouteIcon className="h-3 w-3" /> {a.distance} km avg</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link to="/venues" search={{ area: a.name } as never}>View venues</Link>
                          </Button>
                          <Button
                            size="sm"
                            disabled={meetup.status === "finalized"}
                            onClick={() => vote(a.name)}
                            className={cn(myVote && "bg-mint text-mint-foreground hover:bg-mint/90")}
                          >
                            <Vote className="h-3.5 w-3.5 mr-1.5" />
                            {myVote ? "Voted" : "Vote"}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-20">
            <section className="rounded-2xl border border-border bg-card shadow-card p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Participants ({meetup.participants.length})
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
                {meetup.participants.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={m.avatar} />
                      <AvatarFallback>{m.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" /> {m.address}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs gap-1">
                      <CheckCircle2 className="h-3 w-3 text-mint" /> Joined
                    </Badge>
                  </div>
                ))}
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
                    const count = meetup.votes?.[a.name]?.length ?? 0;
                    if (count === 0) return null;
                    const pct = Math.round((count / totalVotes) * 100);
                  return (
                    <div key={a.name}>
                      <div className="flex justify-between text-sm">
                          <span className="font-medium flex items-center gap-1.5">
                            {winner?.name === a.name && <Trophy className="h-3.5 w-3.5 text-mint" />}
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
              {meetup.status === "finalized" && meetup.finalizedArea && (
                <p className="text-xs text-mint mt-4 flex items-center gap-1">
                  <Trophy className="h-3 w-3" /> Finalized: {meetup.finalizedArea}
                </p>
              )}
            </section>

            <Button size="lg" className="w-full bg-gradient-primary shadow-elegant hover:opacity-90" asChild>
              <Link to="/venues"><MapPin className="h-4 w-4 mr-2" /> Browse venues</Link>
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