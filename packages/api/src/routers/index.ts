import { publicProcedure, router } from "../index";
import { cohortsRouter } from "./cohorts";
import { componentsRouter } from "./components";
import { dashboardRouter } from "./dashboard";
import { productsRouter } from "./products";

export const appRouter = router({
  // Health check endpoint
  healthCheck: publicProcedure.query(() => "OK"),

  // Feature routers
  dashboard: dashboardRouter,
  products: productsRouter,
  cohorts: cohortsRouter,
  components: componentsRouter,
});

export type AppRouter = typeof appRouter;
