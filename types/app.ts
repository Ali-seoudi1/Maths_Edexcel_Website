export type RouteGroup = "public" | "auth" | "app";

export type NavigationItem = {
  title: string;
  href: string;
  disabled?: boolean;
};
