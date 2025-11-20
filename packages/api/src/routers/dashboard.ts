import {
  configFile,
  configGrammarCohort,
  configOption,
  configOptionComponent,
  configPosition,
  count,
  db,
  eq,
  sql,
} from "@zebra-h2b-audit-v2/db";
import { z } from "zod";
import { GAP_ANALYSIS } from "../constants";
import { publicProcedure, router } from "../index";

export const dashboardRouter = router({
  /**
   * Get KPI metrics for dashboard cards
   * Returns: total products, gap count, unique attributes, cohorts
   */
  getKPIMetrics: publicProcedure.query(async () => {
    // Run all queries in parallel for performance
    const [totalProductsResult, uniqueAttributesResult, totalCohortsResult] =
      await Promise.all([
        // Total products (config files)
        db
          .select({ count: count() })
          .from(configFile),

        // Unique attributes
        db
          .select({
            count: sql<number>`COUNT(DISTINCT ${configPosition.attributeLabel})`,
          })
          .from(configPosition),

        // Total cohorts
        db
          .select({ count: count() })
          .from(configGrammarCohort),
      ]);

    return {
      totalProducts: totalProductsResult[0]?.count ?? 0,
      gapCount: GAP_ANALYSIS.gap,
      uniqueAttributes: uniqueAttributesResult[0]?.count ?? 0,
      totalCohorts: totalCohortsResult[0]?.count ?? 0,
    };
  }),

  /**
   * Get field population statistics for ALL distinct attribute labels
   * Returns: field name, files with data, coverage %, files missing, unique values
   * Shows every distinct label separately - "Memory" and "memory" are different!
   */
  getFieldPopulationStats: publicProcedure.query(async () => {
    // Get total file count
    const totalFilesResult = await db
      .select({ count: count() })
      .from(configFile);
    const totalFiles = totalFilesResult[0]?.count ?? 0;

    // Single consolidated query with GROUP BY to calculate all stats in one database call
    const statsResult = await db
      .select({
        field: configPosition.attributeLabel,
        filesWithData: sql<number>`COUNT(DISTINCT ${configPosition.fileId})`,
        uniqueValues: sql<number>`COUNT(DISTINCT ${configOption.code})`,
        uniquePositions: sql<number>`COUNT(DISTINCT ${configPosition.positionIndex})`,
      })
      .from(configPosition)
      .leftJoin(configOption, eq(configOption.positionId, configPosition.id))
      .groupBy(configPosition.attributeLabel);

    // Calculate coverage and format results
    const results = statsResult.map((row) => {
      const coverage =
        totalFiles > 0 ? (row.filesWithData / totalFiles) * 100 : 0;
      return {
        field: row.field,
        filesWithData: row.filesWithData,
        coverage: Number.parseFloat(coverage.toFixed(1)),
        filesMissing: totalFiles - row.filesWithData,
        uniqueValues: row.uniqueValues,
        uniquePositions: row.uniquePositions,
      };
    });

    // Sort by coverage descending
    return results.sort((a, b) => b.coverage - a.coverage);
  }),

  /**
   * Get gap analysis details
   * Returns: missing files categorized by reason
   */
  getGapAnalysis: publicProcedure.query(async () => GAP_ANALYSIS),

  /**
   * Get products with and without a specific field
   * Used for drill-down when user clicks on a field
   * Accepts ANY string (the exact raw attribute_label)
   */
  getProductsMissingField: publicProcedure
    .input(
      z.object({
        field: z.string(), // Accept any string - the exact attribute_label
      })
    )
    .query(async ({ input }) => {
      // Get all file IDs that HAVE this EXACT label
      const filesWithFieldResult = await db
        .select({ fileId: configPosition.fileId })
        .from(configPosition)
        .where(eq(configPosition.attributeLabel, input.field));

      const fileIdsWithField = filesWithFieldResult.map((row) => row.fileId);

      // Get files that HAVE the field
      const productsWithField = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          sourcePath: configFile.sourcePath,
          cohortId: configFile.cohortId,
          positionIndex: configPosition.positionIndex,
        })
        .from(configFile)
        .innerJoin(configPosition, eq(configFile.id, configPosition.fileId))
        .where(
          fileIdsWithField.length > 0
            ? sql`${configPosition.attributeLabel} = ${input.field}`
            : sql`1=0` // If no files have the field, return empty
        )
        .orderBy(configFile.baseModel);

      // Get files that are MISSING the field
      const productsMissingField = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          sourcePath: configFile.sourcePath,
          cohortId: configFile.cohortId,
        })
        .from(configFile)
        .where(
          fileIdsWithField.length > 0
            ? sql`${configFile.id} NOT IN (${sql.join(
                fileIdsWithField.map((id) => sql`${id}`),
                sql`, `
              )})`
            : sql`1=1` // If no files have the field, return all
        )
        .orderBy(configFile.baseModel);

      return {
        productsWithField,
        productsMissingField,
      };
    }),

  /**
   * Get products that have a specific component value for a field
   * Used for filtering products when clicking on a component variant
   * Accepts ANY string for field (the exact raw attribute_label)
   */
  getProductsByComponentValue: publicProcedure
    .input(
      z.object({
        field: z.string(), // Accept any string - the exact attribute_label
        componentValue: z.string(),
      })
    )
    .query(async ({ input }) => {
      // Get all file IDs that have this component value for this EXACT field
      const productsResult = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          sourcePath: configFile.sourcePath,
          cohortId: configFile.cohortId,
        })
        .from(configFile)
        .innerJoin(configPosition, eq(configFile.id, configPosition.fileId))
        .innerJoin(configOption, eq(configPosition.id, configOption.positionId))
        .innerJoin(
          configOptionComponent,
          eq(configOption.id, configOptionComponent.optionId)
        )
        .where(
          sql`${configPosition.attributeLabel} = ${input.field} AND ${configOptionComponent.rawValue} = ${input.componentValue}`
        )
        .orderBy(configFile.baseModel);

      // Deduplicate by file ID (since a file might have multiple options with the same component)
      const uniqueProducts = Array.from(
        new Map(productsResult.map((p) => [p.id, p])).values()
      );

      return uniqueProducts;
    }),

  /**
   * Get component breakdown for a specific field
   * Returns: components with frequency counts and product coverage
   * Accepts ANY string for field (the exact raw attribute_label)
   */
  getComponentBreakdownForField: publicProcedure
    .input(
      z.object({
        field: z.string(), // Accept any string - the exact attribute_label
      })
    )
    .query(async ({ input }) => {
      // Get component breakdown with stats for this EXACT label
      const componentsResult = await db
        .select({
          rawValue: configOptionComponent.rawValue,
          componentType: configOptionComponent.componentType,
          frequency: sql<number>`COUNT(*)`,
          uniqueProducts: sql<number>`COUNT(DISTINCT ${configFile.id})`,
        })
        .from(configOptionComponent)
        .innerJoin(
          configOption,
          eq(configOptionComponent.optionId, configOption.id)
        )
        .innerJoin(
          configPosition,
          eq(configOption.positionId, configPosition.id)
        )
        .innerJoin(configFile, eq(configPosition.fileId, configFile.id))
        .where(eq(configPosition.attributeLabel, input.field))
        .groupBy(
          configOptionComponent.rawValue,
          configOptionComponent.componentType
        )
        .orderBy(sql`COUNT(*) DESC`);

      // Get coverage stats - total products with field vs products with component data
      const coverageResult = await db
        .select({
          totalProductsWithField: sql<number>`COUNT(DISTINCT ${configFile.id})`,
          productsWithComponents: sql<number>`COUNT(DISTINCT CASE WHEN ${configOptionComponent.id} IS NOT NULL THEN ${configFile.id} END)`,
        })
        .from(configFile)
        .innerJoin(configPosition, eq(configFile.id, configPosition.fileId))
        .leftJoin(configOption, eq(configPosition.id, configOption.positionId))
        .leftJoin(
          configOptionComponent,
          eq(configOption.id, configOptionComponent.optionId)
        )
        .where(eq(configPosition.attributeLabel, input.field));

      const coverage = coverageResult[0] ?? {
        totalProductsWithField: 0,
        productsWithComponents: 0,
      };

      return {
        components: componentsResult.map((c) => ({
          rawValue: c.rawValue,
          componentType: c.componentType ?? "unknown",
          frequency: Number(c.frequency),
          uniqueProducts: Number(c.uniqueProducts),
        })),
        coverage: {
          totalProductsWithField: Number(coverage.totalProductsWithField),
          productsWithComponents: Number(coverage.productsWithComponents),
          coveragePercent:
            coverage.totalProductsWithField > 0
              ? (coverage.productsWithComponents /
                  coverage.totalProductsWithField) *
                100
              : 0,
        },
      };
    }),
});
