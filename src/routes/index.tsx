import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowRight,
  Check,
  MessageSquareOff,
  Route as RouteIcon,
  Scale,
  Sparkles,
  MapPin,
  Vote,
  Compass,
  Heart,
  Wallet,
  Users,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FairnessScore } from "@/components/fairness-score";
import { testimonials, faqs } from "@/lib/dummy-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gatherly — Where plans come together" },
      {
        name: "description",
        content:
          "Stop debating, start gathering. Gatherly helps groups pick where to meet, what to do, and how to get there — fairly.",
      },
      { property: "og:title", content: "Gatherly — Where plans come together" },
      {
        property: "og:description",
        content:
          "Find the best place to meet, discover what to do, and coordinate outings without endless back-and-forth.",
      },
    ],
  }),
  component: Landing,
});

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.08] dark:opacity-[0.18]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[60rem] h-[60rem] rounded-full bg-primary/20 blur-[120px] -z-10" />
        <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(120,120,150,0.15)_1px,transparent_0)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-medium text-muted-foreground shadow-card"
        >
          <Sparkles className="h-3.5 w-3.5 text-mint" />
          New: Smart venue voting with live tally
        </motion.div>
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.05 }}
          className="mt-6 text-5xl sm:text-7xl font-bold tracking-tight leading-[1.05]"
        >
          Stop debating.
          <br />
          <span className="text-gradient">Start gathering.</span>
        </motion.h1>
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.1 }}
          className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
        >
          Gatherly helps groups find the best place to meet, discover what to do, and coordinate every outing
          without the endless back-and-forth.
        </motion.p>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            asChild
            size="lg"
            className="bg-gradient-primary shadow-elegant hover:opacity-90 text-base h-12 px-6"
          >
            <Link to="/signup">
              Start planning <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-base h-12 px-6">
            <a href="#how">See how it works</a>
          </Button>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 relative max-w-4xl mx-auto"
        >
          <HeroCard />
        </motion.div>
      </div>
    </section>
  );
}

function HeroCard() {
  const friends = [
    { name: "Aarav", img: "https://i.pravatar.cc/80?img=11", loc: "Andheri" },
    { name: "Priya", img: "https://i.pravatar.cc/80?img=32", loc: "Thane" },
    { name: "Rohan", img: "https://i.pravatar.cc/80?img=14", loc: "Bandra" },
    { name: "Sara", img: "https://i.pravatar.cc/80?img=47", loc: "Powai" },
  ];
  return (
    <div className="relative rounded-3xl border border-border bg-card/90 backdrop-blur shadow-elegant overflow-hidden">
      <div className="grid sm:grid-cols-[1.2fr_1fr] gap-0">
        <div className="p-6 sm:p-8 text-left">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="rounded-full">Sunday Brunch Crew</Badge>
            <span className="text-xs text-muted-foreground">4 friends</span>
          </div>
          <h3 className="mt-4 text-2xl font-semibold">Best place to meet</h3>
          <p className="text-sm text-muted-foreground">Based on travel time & fairness</p>
          <div className="mt-5 space-y-3">
            {[
              { name: "Bandra West", score: 94 },
              { name: "Powai", score: 88 },
              { name: "Andheri East", score: 76 },
            ].map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{a.name}</span>
                </div>
                <FairnessScore value={a.score} size="sm" />
              </motion.div>
            ))}
          </div>
        </div>
        <div className="relative bg-gradient-hero p-6 sm:p-8 text-primary-foreground">
          <p className="text-xs uppercase tracking-wider opacity-80">Group</p>
          <p className="text-lg font-semibold">4 locations · 1 perfect spot</p>
          <div className="mt-6 space-y-3">
            {friends.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.08 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={f.img} alt={f.name} />
                  <AvatarFallback>{f.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs opacity-80">{f.loc}</p>
                </div>
                <Check className="h-4 w-4 text-mint" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="py-10 border-y border-border bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-muted-foreground">
        <span className="text-xs uppercase tracking-wider font-medium">Trusted by groups at</span>
        {["Notion", "Linear", "Figma", "Stripe", "Razorpay", "Zomato"].map((b) => (
          <span key={b} className="font-semibold opacity-70 hover:opacity-100 transition-opacity">{b}</span>
        ))}
      </div>
    </section>
  );
}

function Problem() {
  const pains = [
    { icon: MessageSquareOff, title: "Endless discussions", desc: "200+ messages and still no decision." },
    { icon: Scale, title: "Unfair travel", desc: "Someone always travels twice as long." },
    { icon: Vote, title: "Nobody decides", desc: "Everyone waits for someone else to pick." },
    { icon: Compass, title: "Multiple apps needed", desc: "Maps, polls, chat, calendars — exhausting." },
  ];
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="The problem"
          title="Planning an outing is harder than it should be."
          subtitle="Three friends, three neighborhoods, zero progress."
        />
        <div className="mt-12 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-center">
          <ChatMock />
          <div className="grid sm:grid-cols-2 gap-4">
            {pains.map((p) => (
              <div key={p.title} className="p-5 rounded-2xl border border-border bg-card shadow-card">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 grid place-items-center text-destructive">
                  <p.icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 font-semibold">{p.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ChatMock() {
  const msgs = [
    { from: "A", name: "Friend A", text: "Let's meet in Andheri?", side: "left", color: "bg-muted" },
    { from: "B", name: "Friend B", text: "Too far from Thane 😩", side: "right", color: "bg-primary text-primary-foreground" },
    { from: "C", name: "Friend C", text: "Bandra works for me", side: "left", color: "bg-muted" },
    { from: "A", name: "Friend A", text: "But traffic on Sundays??", side: "left", color: "bg-muted" },
    { from: "B", name: "Friend B", text: "Let's just skip 🙃", side: "right", color: "bg-primary text-primary-foreground" },
  ];
  return (
    <div className="rounded-3xl border border-border bg-card shadow-card p-5 sm:p-7 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-mint grid place-items-center text-mint-foreground font-semibold">
            G
          </div>
          <div>
            <p className="text-sm font-semibold">Group Chat</p>
            <p className="text-xs text-muted-foreground">5 messages · still no plan</p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>
      <div className="pt-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm ${m.color}`}>
              <p className="text-[10px] opacity-70 mb-0.5">{m.name}</p>
              {m.text}
            </div>
          </div>
        ))}
        <div className="flex justify-start">
          <div className="px-3 py-2 rounded-2xl bg-muted text-muted-foreground text-sm inline-flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.15s]" />
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Solution() {
  const steps = [
    { title: "Create meetup", desc: "Name it, set the vibe, pick a date." },
    { title: "Share link", desc: "One link. No accounts required." },
    { title: "Friends add locations", desc: "Each person drops their starting point." },
    { title: "Gatherly finds best areas", desc: "Our fairness engine ranks neighborhoods." },
    { title: "Vote on venue", desc: "Curated cafes, restaurants, parks — vote in tap." },
    { title: "Meetup confirmed", desc: "Calendar, directions, reminders — handled." },
  ];
  return (
    <section id="how" className="py-24 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="How it works" title="From chaos to confirmed in six steps." subtitle="Everything you used to do across five apps, in one flow." />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="relative p-6 rounded-2xl border border-border bg-card shadow-card hover:shadow-elegant transition-shadow"
            >
              <div className="h-9 w-9 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center text-sm font-bold shadow-elegant">
                {i + 1}
              </div>
              <h4 className="mt-4 font-semibold text-lg">{s.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    { icon: Scale, title: "Fairness Engine", desc: "Balances travel time and distance so no one loses." },
    { icon: Sparkles, title: "Smart Recommendations", desc: "Suggests meetup areas and venues tailored to your group." },
    { icon: Vote, title: "Group Voting", desc: "Everyone gets a say. Live tally, no more polls." },
    { icon: MapPin, title: "Venue Discovery", desc: "Restaurants, cafes, parks, activities — one place." },
    { icon: Heart, title: "Meetup Types", desc: "Friends, Family, Office, Date, Study, Birthday, Sports." },
    { icon: Wallet, title: "Cost Awareness", desc: "Estimate travel and outing costs upfront." },
  ];
  return (
    <section id="features" className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader
          eyebrow="Features"
          title="Everything your group needs to actually meet up."
          subtitle="Powerful when you want it. Invisible when you don't."
        />
        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {feats.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-elegant transition-all"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-elegant group-hover:scale-105 transition-transform">
                <f.icon className="h-5 w-5" />
              </div>
              <h4 className="mt-5 font-semibold text-lg">{f.title}</h4>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-24 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Inside Gatherly</p>
          <h2 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            Designed for the group, <span className="text-gradient">tuned to each person.</span>
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Every recommendation balances travel time, distance, group preferences, and the kind of meetup you're
            planning. It feels obvious. It's not.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Multi-modal: car, bike, metro, train, walking",
              "Live recommendations as friends join",
              "Built-in voting with tie-breakers",
              "Calendar + reminders included",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 h-5 w-5 rounded-full bg-mint/20 grid place-items-center">
                  <Check className="h-3 w-3 text-mint" strokeWidth={3} />
                </span>
                <span className="text-sm">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-card shadow-elegant p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Meetup</p>
              <p className="font-semibold">Q3 Offsite Planning</p>
            </div>
            <FairnessScore value={91} size="lg" />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Avg travel", value: "24m", icon: RouteIcon },
              { label: "Distance", value: "9.2km", icon: MapPin },
              { label: "Members", value: "8", icon: Users },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl bg-muted/60 border border-border">
                <s.icon className="h-4 w-4 text-primary mx-auto" />
                <p className="mt-2 text-lg font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-2xl bg-gradient-primary text-primary-foreground">
            <p className="text-xs uppercase tracking-wider opacity-80">Recommended</p>
            <p className="mt-1 text-lg font-semibold">The Bombay Canteen, Lower Parel</p>
            <p className="text-xs opacity-90 mt-1">Voting closes in 2 hours · 6 of 8 voted</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Loved by groups" title="Plans that actually happen." />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="p-6 rounded-2xl border border-border bg-card shadow-card flex flex-col"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-mint text-mint" />
                ))}
              </div>
              <p className="mt-4 text-foreground leading-relaxed">"{t.quote}"</p>
              <div className="mt-6 pt-5 border-t border-border flex items-center gap-3">
                <Avatar><AvatarImage src={t.avatar} alt={t.name} /><AvatarFallback>{t.name[0]}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const tiers = [
    {
      name: "Free",
      price: "₹0",
      tagline: "For casual hangouts",
      features: ["Up to 5 friends per meetup", "Basic fairness engine", "Venue discovery", "Group voting"],
      cta: "Start free",
      highlight: false,
    },
    {
      name: "Pro",
      price: "₹299",
      sub: "/month",
      tagline: "For frequent organizers",
      features: ["Unlimited friends", "Advanced fairness + cost", "Calendar sync & reminders", "Multi-city support", "Priority support"],
      cta: "Try Pro free",
      highlight: true,
    },
    {
      name: "Teams",
      price: "₹899",
      sub: "/month",
      tagline: "For offices & clubs",
      features: ["Everyone in Pro", "Admin dashboard", "Expense splits", "Branded meetup pages", "SSO & SAML"],
      cta: "Contact sales",
      highlight: false,
    },
  ];
  return (
    <section id="pricing" className="py-24 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeader eyebrow="Pricing" title="Simple plans. Big plans." subtitle="Free forever for personal use. Upgrade when your group goes pro." />
        <div className="mt-14 grid md:grid-cols-3 gap-5">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`relative p-7 rounded-2xl border bg-card flex flex-col ${
                t.highlight ? "border-primary shadow-elegant" : "border-border shadow-card"
              }`}
            >
              {t.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary border-0">
                  Most popular
                </Badge>
              )}
              <p className="text-sm font-medium text-muted-foreground">{t.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{t.price}</span>
                {t.sub && <span className="text-sm text-muted-foreground">{t.sub}</span>}
              </div>
              <ul className="mt-6 space-y-3 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-mint shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-7 ${t.highlight ? "bg-gradient-primary shadow-elegant hover:opacity-90" : ""}`}
                variant={t.highlight ? "default" : "outline"}
                asChild
              >
                <Link to="/signup">{t.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  return (
    <section id="faq" className="py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeader eyebrow="FAQ" title="Questions, answered." />
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-base font-medium">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero text-primary-foreground p-10 sm:p-16 text-center shadow-elegant">
          <div className="absolute inset-0 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] [background-size:24px_24px]" />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Your next group plan is one link away.
            </h2>
            <p className="mt-4 text-lg opacity-90 max-w-2xl mx-auto">
              Create your first meetup in under 30 seconds. No credit card needed.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="h-12 px-6 text-base">
                <Link to="/signup">
                  Start planning <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base bg-transparent border-white/30 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                <Link to="/explore">Explore plans</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className="text-xs uppercase tracking-wider text-primary font-semibold">{eyebrow}</p>
      <h2 className="mt-3 text-3xl sm:text-5xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>}
    </div>
  );
}