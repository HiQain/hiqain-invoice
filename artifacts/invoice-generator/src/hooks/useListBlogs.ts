import { useQuery } from "@tanstack/react-query";
import { blogPosts } from "@/lib/blog-store";

export function useListBlogs() {
  return useQuery({
    queryKey: ["blogPosts"],
    queryFn: async () => blogPosts,
    staleTime: 1000 * 60 * 5,
  });
}
