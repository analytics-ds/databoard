import {
  Search,
  BarChart3,
  Wrench,
  KanbanSquare,
  Bell,
  Link,
  FileText,
  Globe,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ── Studies (demo) ────────────────────────────────────────
export interface Study {
  id: string;
  name: string;
  domain: string;
  clientName: string;
}

export const DEMO_STUDIES: Study[] = [
  { id: "1", name: "Etude 1", domain: "quitoque.fr", clientName: "Quitoque" },
  { id: "2", name: "Etude 1", domain: "manomano.fr", clientName: "ManoMano" },
  { id: "3", name: "Etude 1", domain: "decathlon.fr", clientName: "Decathlon" },
  { id: "4", name: "Etude 1", domain: "leroymerlin.fr", clientName: "Leroy Merlin" },
];

// ── Navigation ────────────────────────────────────────────
export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: number;
  disabled?: boolean;
  children?: { title: string; href: string; disabled?: boolean }[];
};

export const NAV_ITEMS: NavItem[] = [
  {
    title: "Suivi de mots cl\u00e9s",
    href: "/keywords",
    icon: Search,
    children: [
      { title: "Tous les mots cl\u00e9s", href: "/keywords" },
      { title: "R\u00e9partition des positions", href: "/keywords/positions" },
      { title: "Visibilit\u00e9", href: "/keywords/visibility" },
    ],
  },
  {
    title: "Trafic et conversion",
    href: "/traffic",
    icon: BarChart3,
  },
  {
    title: "Outils SEO",
    href: "/tools",
    icon: Wrench,
    children: [
      { title: "Recherche de mots cl\u00e9s", href: "/tools/keyword-research" },
      { title: "GEO Monitoring", href: "/tools/geo", disabled: true },
    ],
  },
  {
    title: "Netlinking",
    href: "/netlinking",
    icon: Link,
    children: [
      { title: "Backlinks", href: "/netlinking" },
      { title: "Campagnes", href: "/netlinking/campaigns" },
    ],
  },
  {
    title: "Contenu",
    href: "/content",
    icon: FileText,
  },
  {
    title: "Suivi de projet",
    href: "/projects",
    icon: KanbanSquare,
    children: [
      { title: "T\u00e2ches", href: "/projects" },
      { title: "Documents", href: "/projects/docs" },
    ],
  },
  {
    title: "Alertes",
    href: "/alerts",
    icon: Bell,
    badge: 3,
  },
];

export const BOTTOM_NAV: NavItem[] = [
  { title: "Param\u00e8tres", href: "/settings", icon: Settings },
];

// ── Position colors ───────────────────────────────────────
export const POSITION_COLORS = {
  top3: "bg-emerald-100 text-emerald-800 border-emerald-200",
  top10: "bg-blue-100 text-blue-800 border-blue-200",
  top20: "bg-amber-100 text-amber-800 border-amber-200",
  top50: "bg-orange-100 text-orange-800 border-orange-200",
  beyond: "bg-red-100 text-red-800 border-red-200",
  unranked: "bg-gray-100 text-gray-500 border-gray-200",
} as const;

export function getPositionColor(position: number | null | undefined) {
  if (!position) return POSITION_COLORS.unranked;
  if (position <= 3) return POSITION_COLORS.top3;
  if (position <= 10) return POSITION_COLORS.top10;
  if (position <= 20) return POSITION_COLORS.top20;
  if (position <= 50) return POSITION_COLORS.top50;
  return POSITION_COLORS.beyond;
}

// ── Task config ───────────────────────────────────────────
export const TASK_STATUS_CONFIG = {
  todo: { label: "A faire", color: "bg-gray-100 text-gray-700" },
  in_progress: { label: "En cours", color: "bg-blue-100 text-blue-700" },
  done: { label: "R\u00e9alis\u00e9es", color: "bg-emerald-100 text-emerald-700" },
} as const;

export const TASK_TYPE_CONFIG = {
  content: { label: "content", color: "bg-blue-100 text-blue-700" },
  netlinking: { label: "netlinking", color: "bg-purple-100 text-purple-700" },
  technique: { label: "technique", color: "bg-orange-100 text-orange-700" },
  audit: { label: "audit", color: "bg-pink-100 text-pink-700" },
  other: { label: "autre", color: "bg-gray-100 text-gray-700" },
} as const;

export const PRIORITY_CONFIG = {
  low: { label: "Basse", color: "bg-gray-100 text-gray-600" },
  medium: { label: "Moyenne", color: "bg-blue-100 text-blue-600" },
  high: { label: "Haute", color: "bg-orange-100 text-orange-600" },
  urgent: { label: "Urgente", color: "bg-red-100 text-red-600" },
} as const;

export const CONTENT_STATUS_CONFIG = {
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  writing: { label: "R\u00e9daction", color: "bg-blue-100 text-blue-700" },
  review: { label: "Relecture", color: "bg-amber-100 text-amber-700" },
  published: { label: "Publi\u00e9", color: "bg-emerald-100 text-emerald-700" },
} as const;

export const BACKLINK_STATUS_CONFIG = {
  domain_to_validate: { label: "Domaine \u00e0 valider", color: "bg-amber-100 text-amber-700" },
  article_writing: { label: "Article en r\u00e9daction", color: "bg-blue-100 text-blue-700" },
  article_validated: { label: "Article valid\u00e9", color: "bg-emerald-100 text-emerald-700" },
  published: { label: "Publi\u00e9", color: "bg-emerald-100 text-emerald-700" },
  domain_rejected: { label: "Domaine refus\u00e9", color: "bg-red-100 text-red-700" },
} as const;
