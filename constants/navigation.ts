import {
  Archive,
  BarChart3,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  Megaphone,
  PenSquare,
  Video,
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
    title: "Past Papers & MS",
    href: "/past-papers",
    icon: Archive,
  },
  {
    title: "Key Questions",
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
    title: "Exams",
    href: "/exams",
    icon: ClipboardList,
  },
  {
    title: "Live Meeting",
    href: "/live-meeting",
    icon: Video,
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
