import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/logo";
import { Github, Twitter, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12 grid gap-10 md:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-xs">
            Where plans come together. Stop debating, start gathering.
          </p>
          <div className="flex items-center gap-2 pt-2">
            <a href="#" aria-label="Twitter" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40">
              <Twitter className="h-4 w-4" />
            </a>
            <a href="#" aria-label="GitHub" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40">
              <Github className="h-4 w-4" />
            </a>
            <a href="#" aria-label="LinkedIn" className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/40">
              <Linkedin className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#features" className="hover:text-foreground">Features</a></li>
            <li><a href="#how" className="hover:text-foreground">How it works</a></li>
            <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
            <li><Link to="/explore" className="hover:text-foreground">Explore</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">About</a></li>
            <li><a href="#" className="hover:text-foreground">Blog</a></li>
            <li><a href="#" className="hover:text-foreground">Careers</a></li>
            <li><a href="#" className="hover:text-foreground">Press</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms</a></li>
            <li><a href="#" className="hover:text-foreground">Security</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row gap-2 items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Gatherly Inc. All rights reserved.</span>
          <span>Made for groups everywhere.</span>
        </div>
      </div>
    </footer>
  );
}