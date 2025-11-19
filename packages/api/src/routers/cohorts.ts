import {
  asc,
  configFile,
  configGrammarCohort,
  count,
  db,
  desc,
  eq,
  sql,
} from "@zebra-h2b-audit-v2/db";
import { z } from "zod";
import { publicProcedure, router } from "../index";

export const cohortsRouter = router({
  /**
   * Get all cohorts with file counts and metadata
   * Returns: cohorts list with product counts
   */
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(50),
        sortBy: z
          .enum(["productCount", "signatureHash"])
          .default("productCount"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Get cohorts with product counts
      const cohortsQuery = db
        .select({
          id: configGrammarCohort.id,
          signatureHash: configGrammarCohort.signatureHash,
          signatureJson: configGrammarCohort.signatureJson,
          description: configGrammarCohort.description,
          createdAt: configGrammarCohort.createdAt,
          productCount: sql<number>`COUNT(${configFile.id})`,
          // Calculate position count from signature JSON length
          positionCount: sql<number>`COALESCE(jsonb_array_length(${configGrammarCohort.signatureJson}->'signature'), 0)`,
          // Get a representative base model (first one alphabetically)
          representativeModel: sql<string>`MIN(${configFile.baseModel})`,
        })
        .from(configGrammarCohort)
        .leftJoin(configFile, eq(configGrammarCohort.id, configFile.cohortId))
        .groupBy(configGrammarCohort.id)
        .$dynamic();

      // Apply sorting
      let orderedQuery = cohortsQuery;
      if (sortBy === "productCount") {
        orderedQuery =
          sortOrder === "asc"
            ? cohortsQuery.orderBy(sql`COUNT(${configFile.id}) ASC`)
            : cohortsQuery.orderBy(sql`COUNT(${configFile.id}) DESC`);
      } else if (sortBy === "signatureHash") {
        orderedQuery =
          sortOrder === "asc"
            ? cohortsQuery.orderBy(asc(configGrammarCohort.signatureHash))
            : cohortsQuery.orderBy(desc(configGrammarCohort.signatureHash));
      }

      // Add pagination
      const cohorts = await orderedQuery.limit(limit).offset(offset);

      // Get total count
      const totalCountResult = await db
        .select({ count: count() })
        .from(configGrammarCohort);

      const total = totalCountResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      return {
        cohorts,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    }),

  /**
   * Get single cohort by ID with member files
   * Returns: cohort metadata and list of products in this cohort
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      // Get cohort metadata
      const cohortResult = await db
        .select({
          id: configGrammarCohort.id,
          signatureHash: configGrammarCohort.signatureHash,
          signatureJson: configGrammarCohort.signatureJson,
          description: configGrammarCohort.description,
          createdAt: configGrammarCohort.createdAt,
        })
        .from(configGrammarCohort)
        .where(eq(configGrammarCohort.id, input.id));

      if (cohortResult.length === 0) {
        return null;
      }

      const cohort = cohortResult[0];

      // Get all files in this cohort
      const files = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          sourcePath: configFile.sourcePath,
          specStyle: configFile.specStyle,
          importedAt: configFile.importedAt,
        })
        .from(configFile)
        .where(eq(configFile.cohortId, input.id))
        .orderBy(asc(configFile.baseModel));

      return {
        ...cohort,
        files,
        productCount: files.length,
        positionCount: Array.isArray(cohort?.signatureJson?.signature)
          ? cohort.signatureJson.signature.length
          : 0,
      };
    }),

  /**
   * Get cohort statistics
   * Returns: overall cohort statistics
   */
  getStats: publicProcedure.query(async () => {
    // Total cohorts
    const totalCohortsResult = await db
      .select({ count: count() })
      .from(configGrammarCohort);
    const totalCohorts = totalCohortsResult[0]?.count ?? 0;

    // Total products
    const totalProductsResult = await db
      .select({ count: count() })
      .from(configFile);
    const totalProducts = totalProductsResult[0]?.count ?? 0;

    // Average products per cohort
    const avgProductsPerCohort =
      totalCohorts > 0 ? totalProducts / totalCohorts : 0;

    // Largest cohort
    const largestCohortResult = await db
      .select({
        cohortId: configFile.cohortId,
        productCount: sql<number>`COUNT(${configFile.id})`,
      })
      .from(configFile)
      .groupBy(configFile.cohortId)
      .orderBy(sql`COUNT(${configFile.id}) DESC`)
      .limit(1);

    const largestCohortProductCount = largestCohortResult[0]?.productCount ?? 0;

    // Smallest non-empty cohort
    const smallestCohortResult = await db
      .select({
        cohortId: configFile.cohortId,
        productCount: sql<number>`COUNT(${configFile.id})`,
      })
      .from(configFile)
      .groupBy(configFile.cohortId)
      .orderBy(sql`COUNT(${configFile.id}) ASC`)
      .limit(1);

    const smallestCohortProductCount =
      smallestCohortResult[0]?.productCount ?? 0;

    // Cohorts with single product
    const singletonCohortsResult = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${configFile.cohortId})`,
      })
      .from(
        db
          .select({
            cohortId: configFile.cohortId,
            productCount: sql<number>`COUNT(${configFile.id})`,
          })
          .from(configFile)
          .groupBy(configFile.cohortId)
          .having(sql`COUNT(${configFile.id}) = 1`)
          .as("singleton_cohorts")
      );

    const singletonCohorts = singletonCohortsResult[0]?.count ?? 0;

    return {
      totalCohorts,
      totalProducts,
      avgProductsPerCohort: Number.parseFloat(avgProductsPerCohort.toFixed(2)),
      largestCohortProductCount,
      smallestCohortProductCount,
      singletonCohorts,
      multiProductCohorts: totalCohorts - singletonCohorts,
    };
  }),

  /**
   * Get cohorts by product count range
   * Returns: cohorts filtered by number of products
   */
  getByCohortSize: publicProcedure
    .input(
      z.object({
        minProducts: z.number().int().min(1).default(1),
        maxProducts: z.number().int().optional(),
      })
    )
    .query(async ({ input }) => {
      const { minProducts, maxProducts } = input;

      // Subquery to get cohorts with product counts
      const cohortCounts = db
        .select({
          cohortId: configFile.cohortId,
          productCount: sql<number>`COUNT(${configFile.id})`,
        })
        .from(configFile)
        .groupBy(configFile.cohortId)
        .as("cohort_counts");

      // Build where condition
      let whereCondition = sql`${cohortCounts.productCount} >= ${minProducts}`;
      if (maxProducts !== undefined) {
        whereCondition = sql`${whereCondition} AND ${cohortCounts.productCount} <= ${maxProducts}`;
      }

      // Get cohorts matching the criteria
      const results = await db
        .select({
          id: configGrammarCohort.id,
          signatureHash: configGrammarCohort.signatureHash,
          signatureJson: configGrammarCohort.signatureJson,
          description: configGrammarCohort.description,
          productCount: cohortCounts.productCount,
        })
        .from(configGrammarCohort)
        .innerJoin(
          cohortCounts,
          eq(configGrammarCohort.id, cohortCounts.cohortId)
        )
        .where(whereCondition)
        .orderBy(desc(cohortCounts.productCount));

      return results;
    }),
});
