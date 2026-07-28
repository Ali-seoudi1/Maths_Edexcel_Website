import {
  BarChart3,
  BookOpen,
  ClipboardCheck,
  FileQuestion,
  LayoutDashboard,
  Megaphone,
  PenSquare,
  UserRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardNavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
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
    title: "Model Answers",
    href: "/model-answers",
    icon: FileQuestion,
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
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    title: "Announcements",
    href: "/announcements",
    icon: Megaphone,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: UserRound,
  },
];
