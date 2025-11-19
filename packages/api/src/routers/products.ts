import {
  asc,
  configFile,
  configFileBlob,
  configGrammarCohort,
  configOption,
  configPosition,
  count,
  db,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "@zebra-h2b-audit-v2/db";
import { z } from "zod";
import { publicProcedure, router } from "../index";

export const productsRouter = router({
  /**
   * Get all products with pagination and search
   * Returns: products list, pagination metadata
   */
  getAll: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(1000).default(50),
        search: z.string().optional(),
        baseModel: z.string().optional(),
        sortBy: z
          .enum(["baseModel", "sourcePath", "positionCount"])
          .default("baseModel"),
        sortOrder: z.enum(["asc", "desc"]).default("asc"),
      })
    )
    .query(async ({ input }) => {
      const { page, limit, search, baseModel, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      if (search) {
        conditions.push(
          or(
            ilike(configFile.baseModel, `%${search}%`),
            ilike(configFile.sourcePath, `%${search}%`)
          )
        );
      }
      if (baseModel) {
        conditions.push(eq(configFile.baseModel, baseModel));
      }

      // Get products with position counts
      const productsQuery = db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          specStyle: configFile.specStyle,
          cohortId: configFile.cohortId,
          sourcePath: configFile.sourcePath,
          sourceHash: configFile.sourceHash,
          importedAt: configFile.importedAt,
          positionCount: sql<number>`COUNT(${configPosition.id})`,
        })
        .from(configFile)
        .leftJoin(configPosition, eq(configFile.id, configPosition.fileId))
        .where(
          conditions.length > 0
            ? sql`${sql.join(conditions, sql` AND `)}`
            : undefined
        )
        .groupBy(configFile.id)
        .$dynamic();

      // Apply sorting
      let orderedQuery = productsQuery;
      if (sortBy === "baseModel") {
        orderedQuery =
          sortOrder === "asc"
            ? productsQuery.orderBy(asc(configFile.baseModel))
            : productsQuery.orderBy(desc(configFile.baseModel));
      } else if (sortBy === "sourcePath") {
        orderedQuery =
          sortOrder === "asc"
            ? productsQuery.orderBy(asc(configFile.sourcePath))
            : productsQuery.orderBy(desc(configFile.sourcePath));
      }
      // Note: positionCount sorting would require a subquery, skipping for now

      // Add pagination
      const products = await orderedQuery.limit(limit).offset(offset);

      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(configFile)
        .where(
          conditions.length > 0
            ? sql`${sql.join(conditions, sql` AND `)}`
            : undefined
        );

      const total = totalCountResult[0]?.count ?? 0;
      const totalPages = Math.ceil(total / limit);

      return {
        products,
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
   * Get single product by ID with all positions and options
   * Returns: product metadata, positions with option counts
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      // Get product with cohort info
      const productResult = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          specStyle: configFile.specStyle,
          cohortId: configFile.cohortId,
          sourcePath: configFile.sourcePath,
          sourceHash: configFile.sourceHash,
          importedAt: configFile.importedAt,
          rawMetadata: configFile.rawMetadata,
          signatureHash: configGrammarCohort.signatureHash,
          signatureJson: configGrammarCohort.signatureJson,
        })
        .from(configFile)
        .leftJoin(
          configGrammarCohort,
          eq(configFile.cohortId, configGrammarCohort.id)
        )
        .where(eq(configFile.id, input.id));

      if (productResult.length === 0) {
        return null;
      }

      const product = productResult[0];

      // Get all positions with option counts
      const positions = await db
        .select({
          id: configPosition.id,
          positionIndex: configPosition.positionIndex,
          attributeLabel: configPosition.attributeLabel,
          normalizedLabel: configPosition.normalizedLabel,
          sectionOrder: configPosition.sectionOrder,
          notes: configPosition.notes,
          optionCount: sql<number>`COUNT(${configOption.id})`,
        })
        .from(configPosition)
        .leftJoin(configOption, eq(configPosition.id, configOption.positionId))
        .where(eq(configPosition.fileId, input.id))
        .groupBy(configPosition.id)
        .orderBy(asc(configPosition.positionIndex));

      return {
        ...product,
        positions,
      };
    }),

  /**
   * Get products by base model
   * Returns: list of products matching the base model
   */
  getByBaseModel: publicProcedure
    .input(
      z.object({
        baseModel: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      const products = await db
        .select({
          id: configFile.id,
          baseModel: configFile.baseModel,
          productCode: configFile.productCode,
          specStyle: configFile.specStyle,
          cohortId: configFile.cohortId,
          sourcePath: configFile.sourcePath,
          importedAt: configFile.importedAt,
        })
        .from(configFile)
        .where(eq(configFile.baseModel, input.baseModel))
        .orderBy(asc(configFile.sourcePath));

      return products;
    }),

  /**
   * Get all unique base models (for filters)
   * Returns: sorted list of unique base model names
   */
  getUniqueBaseModels: publicProcedure.query(async () => {
    const results = await db
      .select({ baseModel: configFile.baseModel })
      .from(configFile)
      .groupBy(configFile.baseModel)
      .orderBy(asc(configFile.baseModel));

    return results
      .map((r) => r.baseModel)
      .filter((m): m is string => m !== null);
  }),

  /**
   * Get options for a specific position
   * Returns: list of options with codes and descriptions
   */
  getOptionsForPosition: publicProcedure
    .input(
      z.object({
        positionId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      const options = await db
        .select({
          id: configOption.id,
          code: configOption.code,
          description: configOption.description,
          rawCode: configOption.rawCode,
          rawDescription: configOption.rawDescription,
          sortOrder: configOption.sortOrder,
        })
        .from(configOption)
        .where(eq(configOption.positionId, input.positionId))
        .orderBy(asc(configOption.code));

      return options;
    }),

  /**
   * Get all unique normalized labels (for filters)
   * Returns: sorted list of unique normalized attribute labels
   */
  getAllNormalizedLabels: publicProcedure.query(async () => {
    const results = await db
      .select({ normalizedLabel: configPosition.normalizedLabel })
      .from(configPosition)
      .groupBy(configPosition.normalizedLabel)
      .orderBy(asc(configPosition.normalizedLabel));

    return results.map((r) => r.normalizedLabel);
  }),

  /**
   * Get file blob content for source data viewer
   * Returns: file content (text for CSV, null for XLSX), mime type, filename
   */
  getFileBlob: publicProcedure
    .input(
      z.object({
        fileId: z.number().int().positive(),
      })
    )
    .query(async ({ input }) => {
      // Get file metadata
      const fileResult = await db
        .select({
          sourcePath: configFile.sourcePath,
        })
        .from(configFile)
        .where(eq(configFile.id, input.fileId));

      if (fileResult.length === 0) {
        return null;
      }

      const file = fileResult[0];
      const fileName = file.sourcePath.split("/").pop() || "unknown.csv";

      // Get blob content
      const blobResult = await db
        .select({
          textContent: configFileBlob.textContent,
          mimeType: configFileBlob.mimeType,
        })
        .from(configFileBlob)
        .where(eq(configFileBlob.fileId, input.fileId));

      if (blobResult.length === 0) {
        return null;
      }

      const blob = blobResult[0];

      return {
        textContent: blob.textContent,
        mimeType: blob.mimeType,
        fileName,
      };
    }),
});
