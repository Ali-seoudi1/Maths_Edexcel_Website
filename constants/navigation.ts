import {
  Archive,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  Megaphone,
  PenSquare,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  locked?: boolean;
};

export const dashboardNavigation: DashboardNavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lessons",
    href: "/lessons",
    icon: BookOpen,
  },
  {
    title: "Past Papers",
    href: "/past-papers",
    icon: Archive,
  },
  {
    title: "Model Answers",
    href: "/model-answers",
    icon: FileQuestion,
    locked: true,
  },
  {
    title: "Assignments",
    href: "/assignments",
    icon: PenSquare,
  },
  {
    title: "Quizzes",
    href: "/quizzes",
    icon: ClipboardCheck,
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: Megaphone,
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
];
