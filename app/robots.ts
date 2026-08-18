import type { MetadataRoute } from "next";

const siteUrl = "https://www.omareladawymathigcse.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/about", "/courses", "/contact"],
      disallow: [
        "/admin",
        "/admin/",
        "/api",
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/lessons",
        "/lessons/",
        "/assignments",
        "/assignments/",
        "/quizzes",
        "/quizzes/",
        "/exams",
        "/exams/",
        "/reports",
        "/reports/",
        "/announcements",
        "/announcements/",
        "/notifications",
        "/notifications/",
        "/past-papers",
        "/past-papers/",
        "/model-answers",
        "/model-answers/",
        "/live-meeting",
        "/live-meeting/",
        "/sign-in",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
