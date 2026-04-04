import {
  LayoutDashboard,
  TrendingUp,
  BarChart3,
  Search,
  Wrench,
  Link2,
  FileText,
  ListChecks,
  Bell,
  Settings,
  FolderOpen,
  Globe,
  ClipboardList,
  Calendar,
  FileArchive,
  BookOpen,
  LayoutGrid,
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

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [
      {
        title: "Tableau de bord",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Visibilité",
    items: [
      {
        title: "Mes positions",
        href: "/keywords",
        icon: TrendingUp,
        children: [
          { title: "Vue d'ensemble", href: "/keywords" },
          { title: "Répartition", href: "/keywords/positions" },
          { title: "Évolution", href: "/keywords/visibility" },
        ],
      },
      {
        title: "Mon trafic",
        href: "/traffic",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Actions",
    items: [
      {
        title: "Contenus",
        href: "/content",
        icon: FileText,
      },
      {
        title: "Liens & partenariats",
        href: "/netlinking",
        icon: Link2,
        children: [
          { title: "Tous les liens", href: "/netlinking" },
          { title: "Campagnes", href: "/netlinking/campaigns" },
        ],
      },
      {
        title: "Suivi du projet",
        href: "/projects",
        icon: ClipboardList,
        children: [
          { title: "To-do hebdo", href: "/projects" },
          { title: "Tâches", href: "/projects/kanban" },
          { title: "Comptes rendus", href: "/projects/reports" },
          { title: "Documents", href: "/projects/documents" },
          { title: "Ressources", href: "/projects/resources" },
        ],
      },
    ],
  },
  {
    label: "Outils",
    items: [
      {
        title: "Recherche de mots clés",
        href: "/tools/keyword-research",
        icon: Search,
      },
      {
        title: "GEO Monitoring",
        href: "/tools/geo",
        icon: Globe,
        disabled: true,
      },
    ],
  },
];

// Consultant/admin only — cross-client overview
export const CONSULTANT_NAV: NavItem = {
  title: "Vue d'ensemble",
  href: "/overview",
  icon: LayoutGrid,
};

export const BOTTOM_NAV: NavItem[] = [
  { title: "Alertes", href: "/alerts", icon: Bell, badge: 3 },
  { title: "Paramètres du projet", href: "/settings", icon: Settings },
];

// Keep flat NAV_ITEMS for backward compat (topbar etc.)
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

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
  done: { label: "Réalisées", color: "bg-emerald-100 text-emerald-700" },
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
  writing: { label: "Rédaction", color: "bg-blue-100 text-blue-700" },
  review: { label: "Relecture", color: "bg-amber-100 text-amber-700" },
  published: { label: "Publié", color: "bg-emerald-100 text-emerald-700" },
} as const;

export const BACKLINK_STATUS_CONFIG = {
  domain_to_validate: { label: "Domaine à valider", color: "bg-amber-100 text-amber-700" },
  article_writing: { label: "Article en rédaction", color: "bg-blue-100 text-blue-700" },
  article_validated: { label: "Article validé", color: "bg-emerald-100 text-emerald-700" },
  published: { label: "Publié", color: "bg-emerald-100 text-emerald-700" },
  domain_rejected: { label: "Domaine refusé", color: "bg-red-100 text-red-700" },
} as const;
