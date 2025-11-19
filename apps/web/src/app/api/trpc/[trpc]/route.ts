import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createContext } from "@zebra-h2b-audit-v2/api/context";
import { appRouter } from "@zebra-h2b-audit-v2/api/routers/index";
import type { NextRequest } from "next/server";

function handler(req: NextRequest) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createContext(req as any),
  });
}
export { handler as GET, handler as POST };
