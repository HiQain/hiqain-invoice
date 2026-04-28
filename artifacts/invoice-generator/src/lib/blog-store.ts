export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  imageDataUrl?: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "blog-1",
    title: "Launch-ready design for your workflow",
    excerpt: "A quick overview of the design system, layout, and responsive patterns used in this app.",
    content:
      "This post contains sample content for the blog route. Replace it with your actual product updates, tutorials, or announcements.",
    publishedAt: "2026-04-28",
    imageDataUrl:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "blog-2",
    title: "How to streamline invoices and estimates",
    excerpt: "Tips for using the dashboard, uploading assets, and keeping every estimate under control.",
    content:
      "This article is a placeholder that demonstrates how blog content can be rendered from static data in the invoice generator.",
    publishedAt: "2026-04-15",
  },
];
