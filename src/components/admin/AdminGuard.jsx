import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";

export function useIsAdmin() {
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity
  });

  return user?.role === "admin";
}

export function AdminOnly({ children, fallback = null }) {
  const isAdmin = useIsAdmin();
  return isAdmin ? children : fallback;
}