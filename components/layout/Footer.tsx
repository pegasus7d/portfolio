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
    href: "https://github.com/debayan",
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
    <footer className="border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-6 py-8 sm:flex-row sm:justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} Debayan Biswas
        </p>
        <ul className="flex items-center gap-5">
          {SOCIAL_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="group flex items-center gap-2 text-sm text-[var(--text-muted)] transition-all duration-300 hover:text-[var(--text-primary)]"
                >
                  <Icon
                    size={16}
                    className="transition-all duration-300 group-hover:text-[var(--accent)] group-hover:scale-110 group-hover:drop-shadow-[0_0_5px_rgba(59,130,246,0.35)]"
                  />
                  <span className="hidden sm:inline">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
