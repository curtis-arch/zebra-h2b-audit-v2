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
});
