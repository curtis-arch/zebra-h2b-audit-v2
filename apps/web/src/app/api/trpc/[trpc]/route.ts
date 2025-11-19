import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@zebra-h2b-audit-v2/api/routers/index";
import { createContext } from "@zebra-h2b-audit-v2/api/context";
import { NextRequest } from "next/server";

function handler(req: NextRequest) {
	return fetchRequestHandler({
		endpoint: "/api/trpc",
		req,
		router: appRouter,
		createContext: () => createContext(req),
	});
}
export { handler as GET, handler as POST };
