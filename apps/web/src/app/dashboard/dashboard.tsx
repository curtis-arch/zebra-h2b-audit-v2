"use client";
import type { authClient } from "@/lib/auth-client";

export default function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  return (
    <>
      <p className="text-muted-foreground">
        This is a placeholder dashboard component. The main dashboard is at the
        root path (/).
      </p>
    </>
  );
}
