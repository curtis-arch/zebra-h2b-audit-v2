import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Grammar Cohorts - Groups of files with identical SKU structure
 *
 * A cohort represents a set of configuration files that share the same
 * grammar signature (position indices + normalized attribute labels).
 */
export const configGrammarCohort = pgTable("config_grammar_cohort", {
  id: serial("id").primaryKey(),
  signatureHash: varchar("signature_hash", { length: 255 }).notNull(),
  signatureJson: jsonb("signature_json").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/**
 * Configuration Files - Individual configuration matrix files
 *
 * Each file represents a Zebra product configuration matrix that defines
 * valid SKU structures for a base model.
 */
export const configFile = pgTable("config_file", {
  id: serial("id").primaryKey(),
  baseModel: varchar("base_model", { length: 64 }),
  productCode: varchar("product_code", { length: 128 }),
  specStyle: varchar("spec_style", { length: 32 }).notNull(),
  cohortId: integer("cohort_id").references(() => configGrammarCohort.id),
  sourcePath: text("source_path").notNull(),
  sourceHash: varchar("source_hash", { length: 64 }),
  importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow(),
  rawMetadata: jsonb("raw_metadata"),
});

/**
 * Configuration Positions - SKU character positions with attribute meanings
 *
 * Each position defines what a specific character index in the SKU represents
 * (e.g., position 5 = "Processor Type").
 */
export const configPosition = pgTable(
  "config_position",
  {
    id: serial("id").primaryKey(),
    fileId: integer("file_id")
      .notNull()
      .references(() => configFile.id, { onDelete: "cascade" }),
    positionIndex: integer("position_index"),
    attributeLabel: text("attribute_label").notNull(),
    normalizedLabel: varchar("normalized_label", { length: 255 }).notNull(),
    sectionOrder: integer("section_order").notNull().default(0),
    notes: text("notes"),
  },
  (table) => ({
    // Unique constraint: one position per (file, index, label) combination
    uqPositionFileIndexLabel: uniqueIndex("uq_position_file_index_label").on(
      table.fileId,
      table.positionIndex,
      table.normalizedLabel
    ),
    // Performance indexes for field population queries
    idxPositionAttributeLabel: index("idx_position_attribute_label").on(
      table.attributeLabel
    ),
    idxPositionFileId: index("idx_position_file_id").on(table.fileId),
    idxPositionIndex: index("idx_position_index").on(table.positionIndex),
    idxPositionLabelFileId: index("idx_position_label_file_id").on(
      table.attributeLabel,
      table.fileId
    ),
  })
);

/**
 * Configuration Options - Valid codes/values for each position
 *
 * Each option represents an allowed character code at a specific position
 * (e.g., at position 5, code "A" = "Snapdragon 660 2.2 GHz").
 */
export const configOption = pgTable(
  "config_option",
  {
    id: serial("id").primaryKey(),
    positionId: integer("position_id")
      .notNull()
      .references(() => configPosition.id, { onDelete: "cascade" }),
    code: varchar("code", { length: 16 }).notNull(),
    description: text("description").notNull(),
    rawCode: text("raw_code"),
    rawDescription: text("raw_description"),
    sortOrder: integer("sort_order"),
  },
  (table) => ({
    // Unique constraint: one code per position
    uqOptionPositionCode: uniqueIndex("uq_option_position_code").on(
      table.positionId,
      table.code
    ),
    // Performance index for join queries
    idxOptionPositionId: index("idx_option_position_id").on(table.positionId),
  })
);

/**
 * Configuration File Blobs - Original file content storage
 *
 * Stores raw file bytes and text for audit trail, parser validation,
 * and duplicate detection. Separate table to avoid TOAST overhead.
 */
export const configFileBlob = pgTable(
  "config_file_blob",
  {
    // Primary key = foreign key enforces 1:1 relationship
    fileId: integer("file_id")
      .primaryKey()
      .references(() => configFile.id, { onDelete: "cascade" }),

    // File content storage
    fileContent: text("file_content").notNull(), // BYTEA stored as text in Drizzle
    textContent: text("text_content"), // UTF-8 decoded text (CSV/TSV only)

    // File metadata
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    encoding: varchar("encoding", { length: 32 }),

    // Integrity and audit
    checksumSha256: varchar("checksum_sha256", { length: 64 }).notNull(),
    storedAt: timestamp("stored_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Index for finding duplicate files across imports
    idxFileBlobChecksum: index("idx_file_blob_checksum").on(
      table.checksumSha256
    ),
  })
);

/**
 * Configuration Option Components - Extracted semantic components
 *
 * Stores extracted semantic components from config_option descriptions.
 * Each component represents a meaningful piece of information (e.g., "Bluetooth", "4GB RAM", "US")
 * extracted from option descriptions. Enables semantic search and filtering.
 */
export const configOptionComponent = pgTable(
  "config_option_component",
  {
    id: serial("id").primaryKey(),

    // Foreign key to the option this component was extracted from
    optionId: integer("option_id")
      .notNull()
      .references(() => configOption.id, { onDelete: "cascade" }),

    // The raw component value as extracted from description
    rawValue: varchar("raw_value", { length: 255 }).notNull(),

    // Position of this component in the description (0-based, left-to-right)
    sequencePosition: integer("sequence_position").notNull(),

    // Semantic type of this component (e.g., 'connectivity', 'memory_spec', 'region')
    componentType: varchar("component_type", { length: 100 }),

    // Normalized/canonical form of the component value
    normalizedValue: varchar("normalized_value", { length: 255 }),

    // Optional reference to a taxonomy/controlled vocabulary (future use)
    taxonomyId: integer("taxonomy_id"),

    // Audit timestamp
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    // Ensure each option has at most one component per sequence position
    uqComponentOptionPosition: uniqueIndex("uq_component_option_position").on(
      table.optionId,
      table.sequencePosition
    ),
    // Indexes for efficient lookups
    idxComponentRawValue: index("idx_component_raw_value").on(table.rawValue),
    idxComponentOptionId: index("idx_component_option_id").on(table.optionId),
    idxComponentNormalized: index("idx_component_normalized").on(
      table.normalizedValue
    ),
    idxComponentType: index("idx_component_type").on(table.componentType),
  })
);
