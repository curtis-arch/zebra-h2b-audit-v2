import {
  and,
  configFile,
  configOption,
  configOptionComponent,
  configPosition,
  db,
  desc,
  eq,
  sql,
} from "@zebra-h2b-audit-v2/db";
import { z } from "zod";
import { publicProcedure, router } from "../index";

// Component type schema - accepts any string from config_option_component.component_type
const componentTypeSchema = z
  .string()
  .min(1, { error: "Component type is required" })
  .max(100, { error: "Component type must be 100 characters or less" })
  .describe("Raw component type from config_option_component.component_type");

export const componentsRouter = router({
  /**
   * Get statistics for all component types
   * Returns: count and unique values for each component type
   */
  getComponentTypes: publicProcedure.query(async () => {
    const stats = await db
      .select({
        componentType: configOptionComponent.componentType,
        totalCount: sql<number>`COUNT(*)`,
        uniqueValues: sql<number>`COUNT(DISTINCT ${configOptionComponent.rawValue})`,
      })
      .from(configOptionComponent)
      .where(sql`${configOptionComponent.componentType} IS NOT NULL`)
      .groupBy(configOptionComponent.componentType)
      .orderBy(configOptionComponent.componentType);

    return stats.map((stat) => ({
      componentType: stat.componentType as string,
      totalCount: Number(stat.totalCount),
      uniqueValues: Number(stat.uniqueValues),
    }));
  }),

  /**
   * Get all unique component values for a specific type with frequency counts
   * Returns: list of component values with occurrence counts
   */
  getComponentsByType: publicProcedure
    .input(
      z.object({
        componentType: componentTypeSchema,
        limit: z.number().min(1).max(1000).default(100),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const { componentType, limit, offset } = input;

      // Get unique raw_values with frequency counts
      const components = await db
        .select({
          rawValue: configOptionComponent.rawValue,
          frequency: sql<number>`COUNT(*)`,
          optionCount: sql<number>`COUNT(DISTINCT ${configOptionComponent.optionId})`,
        })
        .from(configOptionComponent)
        .where(eq(configOptionComponent.componentType, componentType))
        .groupBy(configOptionComponent.rawValue)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const totalResult = await db
        .select({
          total: sql<number>`COUNT(DISTINCT ${configOptionComponent.rawValue})`,
        })
        .from(configOptionComponent)
        .where(eq(configOptionComponent.componentType, componentType));

      const total = Number(totalResult[0]?.total ?? 0);

      return {
        components: components.map((c) => ({
          rawValue: c.rawValue,
          frequency: Number(c.frequency),
          optionCount: Number(c.optionCount),
        })),
        total,
      };
    }),

  /**
   * Get all products (config files) that use a specific component value
   * Returns: list of products with the component in their options
   */
  getProductsForComponent: publicProcedure
    .input(
      z.object({
        componentType: componentTypeSchema,
        rawValue: z.string(),
      })
    )
    .query(async ({ input }) => {
      const { componentType, rawValue } = input;

      // Get all products that have this component
      const products = await db
        .selectDistinct({
          fileId: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          specStyle: configFile.specStyle,
          sourcePath: configFile.sourcePath,
          optionCode: configOption.code,
          optionDescription: configOption.description,
          positionIndex: configPosition.positionIndex,
          attributeLabel: configPosition.attributeLabel,
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
        .where(
          and(
            eq(configOptionComponent.componentType, componentType),
            eq(configOptionComponent.rawValue, rawValue)
          )
        )
        .orderBy(configFile.baseModel, configFile.productCode);

      // Group by file to get unique products with their options
      const productsMap = new Map<
        number,
        {
          fileId: number;
          baseModel: string | null;
          productCode: string | null;
          specStyle: string;
          sourcePath: string | null;
          options: Array<{
            code: string;
            description: string | null;
            positionIndex: number | null;
            attributeLabel: string;
          }>;
        }
      >();

      products.forEach((p) => {
        if (!productsMap.has(p.fileId)) {
          productsMap.set(p.fileId, {
            fileId: p.fileId,
            baseModel: p.baseModel,
            productCode: p.productCode,
            specStyle: p.specStyle,
            sourcePath: p.sourcePath,
            options: [],
          });
        }
        productsMap.get(p.fileId)!.options.push({
          code: p.optionCode,
          description: p.optionDescription,
          positionIndex: p.positionIndex,
          attributeLabel: p.attributeLabel,
        });
      });

      return {
        componentType,
        rawValue,
        products: Array.from(productsMap.values()),
        totalProducts: productsMap.size,
      };
    }),

  /**
   * Get component statistics for a specific type
   * Returns: detailed stats about a component type
   */
  getComponentTypeStats: publicProcedure
    .input(
      z.object({
        componentType: componentTypeSchema,
      })
    )
    .query(async ({ input }) => {
      const { componentType } = input;

      // Get basic stats
      const statsResult = await db
        .select({
          totalCount: sql<number>`COUNT(*)`,
          uniqueValues: sql<number>`COUNT(DISTINCT ${configOptionComponent.rawValue})`,
          uniqueProducts: sql<number>`COUNT(DISTINCT ${configPosition.fileId})`,
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
        .where(eq(configOptionComponent.componentType, componentType));

      const stats = statsResult[0];

      // Get top 5 most common values
      const topValues = await db
        .select({
          rawValue: configOptionComponent.rawValue,
          frequency: sql<number>`COUNT(*)`,
        })
        .from(configOptionComponent)
        .where(eq(configOptionComponent.componentType, componentType))
        .groupBy(configOptionComponent.rawValue)
        .orderBy(desc(sql`COUNT(*)`))
        .limit(5);

      return {
        componentType,
        totalCount: Number(stats?.totalCount ?? 0),
        uniqueValues: Number(stats?.uniqueValues ?? 0),
        uniqueProducts: Number(stats?.uniqueProducts ?? 0),
        topValues: topValues.map((v) => ({
          rawValue: v.rawValue,
          frequency: Number(v.frequency),
        })),
      };
    }),

  /**
   * Get products (config files) that use a specific component type
   * Returns: list of distinct products with basic metadata
   */
  getProductsByComponentType: publicProcedure
    .input(
      z.object({
        componentType: componentTypeSchema,
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const { componentType, limit } = input;

      // Get distinct products that have this component type
      const products = await db
        .selectDistinct({
          fileId: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          specStyle: configFile.specStyle,
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
        .where(eq(configOptionComponent.componentType, componentType))
        .orderBy(configFile.baseModel)
        .limit(limit);

      // Get total count for the popover header
      const totalResult = await db
        .select({
          total: sql<number>`COUNT(DISTINCT ${configFile.id})`,
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
        .where(eq(configOptionComponent.componentType, componentType));

      const totalCount = Number(totalResult[0]?.total ?? 0);

      return {
        products: products.map((p) => ({
          fileId: p.fileId,
          baseModel: p.baseModel,
          productCode: p.productCode,
          specStyle: p.specStyle,
        })),
        totalCount,
      };
    }),

  /**
   * Get component types with similarity grouping and Zebra attribute matching
   * Returns: component types with similar values grouped together
   */
  getComponentTypesWithSimilarity: publicProcedure
    .input(
      z.object({
        similarityThreshold: z.number().min(0).max(1).default(0.85),
      })
    )
    .query(async ({ input }) => {
      const { similarityThreshold } = input;

      // Complex query using vector embeddings for similarity matching
      const results = await db.execute(sql`
        WITH component_stats AS (
          -- Get base stats for each component_type
          SELECT
            component_type,
            COUNT(DISTINCT option_id) as product_count,
            COUNT(DISTINCT sequence_position) as position_count,
            array_agg(DISTINCT sequence_position::text ORDER BY sequence_position::text) as positions
          FROM config_option_component
          WHERE component_type IS NOT NULL
          GROUP BY component_type
        ),
        component_positions AS (
          -- Pre-compute positions for all component types to avoid correlated subquery
          SELECT
            component_type,
            array_agg(DISTINCT sequence_position::text ORDER BY sequence_position::text) as positions
          FROM config_option_component
          WHERE component_type IS NOT NULL
          GROUP BY component_type
        ),
        similar_groups AS (
          -- Use vector embeddings to find similar component types (excluding self)
          SELECT
            ct.component_type,
            COUNT(DISTINCT ec2.value) as similar_count,
            array_agg(DISTINCT ec2.value ORDER BY ec2.value) as similar_values,
            jsonb_agg(
              jsonb_build_object(
                'value', ec2.value,
                'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1),
                'positions', COALESCE(cp.positions, ARRAY[]::text[])
              ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
            ) FILTER (WHERE ec2.value IS NOT NULL) as similar_matches
          FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) ct
          LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
          LEFT JOIN embedding_cache ec2
            ON ec2.value != ct.component_type  -- Exclude self-matches
            AND ec2.source_column = 'attribute_label'
            AND ec.embedding_small IS NOT NULL
            AND ec2.embedding_small IS NOT NULL
            AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= ${similarityThreshold}
          LEFT JOIN component_positions cp ON cp.component_type = ec2.value
          GROUP BY ct.component_type
        ),
        zebra_matches AS (
          -- Check for Zebra attribute matches
          SELECT
            c.component_type,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM zebra_provided_attributes z
                WHERE LOWER(z.attribute_name) = LOWER(c.component_type)
              ) THEN 'yes'
              WHEN EXISTS (
                SELECT 1 FROM zebra_provided_attributes z
                WHERE similarity(LOWER(z.attribute_name), LOWER(c.component_type)) >= 0.7
              ) THEN 'partial'
              ELSE 'no'
            END as zebra_match
          FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) c
        ),
        htb_exact_matches AS (
          -- Check for HTB attribute exact matches
          SELECT
            c.component_type,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM htb_attribute_mapping_zebra_provided h
                WHERE LOWER(h.attribute_name_for_htb) = LOWER(c.component_type)
              ) THEN 'yes'
              ELSE 'no'
            END as htb_match
          FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) c
        ),
        htb_distance_matches AS (
          -- Use vector embeddings to find similar HTB attributes
          SELECT
            ct.component_type,
            jsonb_agg(
              jsonb_build_object(
                'value', ec2.value,
                'matchPercentage', ROUND(((1 - (ec.embedding_small <=> ec2.embedding_small)) * 100)::numeric, 1)
              ) ORDER BY (1 - (ec.embedding_small <=> ec2.embedding_small)) DESC
            ) FILTER (WHERE ec2.value IS NOT NULL) as htb_similar_matches
          FROM (SELECT DISTINCT component_type FROM config_option_component WHERE component_type IS NOT NULL) ct
          LEFT JOIN embedding_cache ec ON ec.value = ct.component_type AND ec.source_column = 'attribute_label'
          LEFT JOIN embedding_cache ec2
            ON ec2.source_column = 'attribute_name_for_htb'
            AND ec.embedding_small IS NOT NULL
            AND ec2.embedding_small IS NOT NULL
            AND (1 - (ec.embedding_small <=> ec2.embedding_small)) >= 0.3
          GROUP BY ct.component_type
        )
        SELECT
          cs.component_type,
          COALESCE(sg.similar_count, 0) as similar_count,
          COALESCE(sg.similar_values, ARRAY[]::text[]) as similar_values,
          COALESCE(sg.similar_matches, '[]'::jsonb) as similar_matches,
          cs.product_count,
          cs.position_count,
          cs.positions,
          zm.zebra_match,
          hem.htb_match,
          COALESCE(hdm.htb_similar_matches, '[]'::jsonb) as htb_similar_matches
        FROM component_stats cs
        LEFT JOIN similar_groups sg ON cs.component_type = sg.component_type
        LEFT JOIN zebra_matches zm ON cs.component_type = zm.component_type
        LEFT JOIN htb_exact_matches hem ON cs.component_type = hem.component_type
        LEFT JOIN htb_distance_matches hdm ON cs.component_type = hdm.component_type
        ORDER BY cs.component_type
      `);

      // Transform results to match output schema
      return results.rows.map((row: any) => ({
        componentType: row.component_type as string,
        similarCount: Number(row.similar_count),
        similarValues: (row.similar_values || []) as string[],
        similarMatches: (row.similar_matches || []) as any[],
        productCount: Number(row.product_count),
        positionCount: Number(row.position_count),
        positions: (row.positions || []) as string[],
        zebraMatch: row.zebra_match as "yes" | "partial" | "no",
        htbMatch: row.htb_match as "yes" | "no",
        htbSimilarMatches: (row.htb_similar_matches || []) as Array<{
          value: string;
          matchPercentage: number;
        }>,
      }));
    }),
});
