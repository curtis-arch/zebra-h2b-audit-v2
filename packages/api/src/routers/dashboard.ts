import {
  configFile,
  configGrammarCohort,
  configOption,
  configOptionComponent,
  configPosition,
  count,
  db,
  eq,
  inArray,
  sql,
} from "@zebra-h2b-audit-v2/db";
import { z } from "zod";
import {
  FIELD_LABEL_MAPPINGS,
  type FieldName,
  GAP_ANALYSIS,
} from "../constants";
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
   * Get field population statistics for 10 key fields
   * Returns: field name, files with data, coverage %, files missing, unique values
   */
  getFieldPopulationStats: publicProcedure.query(async () => {
    // Get total file count first
    const totalFilesResult = await db
      .select({ count: count() })
      .from(configFile);
    const totalFiles = totalFilesResult[0]?.count ?? 0;

    // Build results for each field
    const results = await Promise.all(
      Object.entries(FIELD_LABEL_MAPPINGS).map(async ([fieldName, labels]) => {
        // Create case-insensitive label matching using LOWER()
        const lowerLabels = labels.map(l => l.toLowerCase());

        // Count files that have ANY of these labels (case-insensitive)
        const filesWithDataResult = await db
          .select({
            count: sql<number>`COUNT(DISTINCT ${configPosition.fileId})`,
          })
          .from(configPosition)
          .where(sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)})`);

        const filesWithData = filesWithDataResult[0]?.count ?? 0;

        // Count unique option codes across all labels for this field (case-insensitive)
        const uniqueValuesResult = await db
          .select({ count: sql<number>`COUNT(DISTINCT ${configOption.code})` })
          .from(configOption)
          .innerJoin(
            configPosition,
            eq(configOption.positionId, configPosition.id)
          )
          .where(sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)})`);

        const uniqueValues = uniqueValuesResult[0]?.count ?? 0;

        const coverage =
          totalFiles > 0 ? (filesWithData / totalFiles) * 100 : 0;

        return {
          field: fieldName as FieldName,
          filesWithData,
          coverage: Number.parseFloat(coverage.toFixed(1)),
          filesMissing: totalFiles - filesWithData,
          uniqueValues,
        };
      })
    );

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
   */
  getProductsMissingField: publicProcedure
    .input(
      z.object({
        field: z.enum([
          "Memory",
          "Series",
          "Family",
          "Print Width",
          "Character Set",
          "Interface",
          "Media Type",
          "Label Sensor",
          "Country Code",
          "Channel Type",
        ]),
      })
    )
    .query(async ({ input }) => {
      const labels = FIELD_LABEL_MAPPINGS[input.field];
      const lowerLabels = labels.map(l => l.toLowerCase());

      // Get all file IDs that HAVE any of these labels (case-insensitive)
      const filesWithFieldResult = await db
        .select({ fileId: configPosition.fileId })
        .from(configPosition)
        .where(sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)})`);

      const fileIdsWithField = filesWithFieldResult.map((row) => row.fileId);

      // Get files that HAVE the field
      const productsWithField = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          sourcePath: configFile.sourcePath,
          cohortId: configFile.cohortId,
        })
        .from(configFile)
        .where(
          fileIdsWithField.length > 0
            ? inArray(configFile.id, fileIdsWithField)
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
   */
  getProductsByComponentValue: publicProcedure
    .input(
      z.object({
        field: z.enum([
          "Memory",
          "Series",
          "Family",
          "Print Width",
          "Character Set",
          "Interface",
          "Media Type",
          "Label Sensor",
          "Country Code",
          "Channel Type",
        ]),
        componentValue: z.string(),
      })
    )
    .query(async ({ input }) => {
      const labels = FIELD_LABEL_MAPPINGS[input.field];
      const lowerLabels = labels.map(l => l.toLowerCase());

      // Get all file IDs that have this component value for this field (case-insensitive)
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
          sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)}) AND ${configOptionComponent.rawValue} = ${input.componentValue}`
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
   */
  getComponentBreakdownForField: publicProcedure
    .input(
      z.object({
        field: z.enum([
          "Memory",
          "Series",
          "Family",
          "Print Width",
          "Character Set",
          "Interface",
          "Media Type",
          "Label Sensor",
          "Country Code",
          "Channel Type",
        ]),
      })
    )
    .query(async ({ input }) => {
      const labels = FIELD_LABEL_MAPPINGS[input.field];
      const lowerLabels = labels.map(l => l.toLowerCase());

      // Get component breakdown with stats (case-insensitive)
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
        .where(sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)})`)
        .groupBy(
          configOptionComponent.rawValue,
          configOptionComponent.componentType
        )
        .orderBy(sql`COUNT(*) DESC`);

      // Get coverage stats - total products with field vs products with component data (case-insensitive)
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
        .where(sql`LOWER(${configPosition.attributeLabel}) IN (${sql.join(lowerLabels.map(l => sql`${l}`), sql`, `)})`);

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
