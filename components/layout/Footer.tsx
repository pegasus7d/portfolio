import Link from "next/link";
import { Mail } from "lucide-react";
import { GithubIcon, LinkedinIcon } from "@/components/icons";
import type { ComponentType, SVGProps } from "react";

const SOCIAL_LINKS: { label: string; href: string; icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }> }[] = [
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/debayan-biswas",
    icon: LinkedinIcon,
  },
  {
    label: "GitHub",
    href: "https://github.com/pegasus7d",
    icon: GithubIcon,
  },
  {
    label: "Email",
    href: "mailto:debayan.iitkgp@gmail.com",
    icon: Mail,
  },
];

export default function Footer() {
  return (
    <footer className="relative bg-[var(--bg)]">
      {/* Glow bleed from Contact section */}
      <div
        className="pointer-events-none absolute inset-x-0 -top-16 h-24"
        aria-hidden="true"
        style={{
          background: "radial-gradient(ellipse 50% 100% at 50% 0%, rgba(59,130,246,0.04) 0%, transparent 80%)",
        }}
      />

      {/* Gradient top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        aria-hidden="true"
        style={{
          background: "linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.18) 40%, rgba(167,139,250,0.12) 60%, transparent 90%)",
        }}
      />

      <div className="mx-auto flex max-w-5xl flex-col items-center gap-5 px-6 py-10 sm:flex-row sm:justify-between">
        {/* Logo / copyright */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="group text-sm font-semibold text-[var(--text-primary)] transition-all duration-300 hover:text-[var(--accent)]"
          >
            <span className="inline-block transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.35)] group-hover:scale-105">
              DB
            </span>
          </Link>
          <span className="text-xs text-[var(--border)]">/</span>
          <p className="text-xs text-[var(--text-muted)]">
            &copy; {new Date().getFullYear()} Debayan Biswas
          </p>
        </div>

        {/* Social links */}
        <ul className="flex items-center gap-1">
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="group flex items-center gap-2 rounded-lg px-3 py-2 text-[var(--text-muted)] transition-all duration-300 hover:-translate-y-px hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                >
                  <Icon
                    size={15}
                    className="transition-all duration-300 group-hover:text-[var(--accent)] group-hover:scale-110 group-hover:drop-shadow-[0_0_6px_rgba(59,130,246,0.3)]"
                  />
                  <span className="hidden text-xs transition-colors duration-300 group-hover:text-[var(--text-primary)] sm:inline">
                    {link.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
