import {
  boolean,
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
    optionId: integer("option_id")
      .notNull()
      .references(() => configOption.id, { onDelete: "cascade" }),
    rawValue: varchar("raw_value", { length: 255 }).notNull(),
    sequencePosition: integer("sequence_position").notNull(),
    componentType: varchar("component_type", { length: 100 }),
    normalizedValue: varchar("normalized_value", { length: 255 }),
    taxonomyId: integer("taxonomy_id"),
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

/**
 * Zebra-Provided Attributes - Core attribute data with wide columns
 *
 * Stores 260 attributes from attribute-comparison-by-type.xlsx with
 * frequently-populated properties in columnar format. Each row represents
 * one attribute with its core metadata.
 *
 * CRITICAL: attribute_name MUST preserve exact Excel values (no normalization).
 * This is the golden source for attribute name matching across systems.
 */
export const zebraProvidedAttributes = pgTable(
  "zebra_provided_attributes",
  {
    id: serial("id").primaryKey(),
    attributeName: text("attribute_name").notNull(),
    excelRowNumber: integer("excel_row_number").notNull(),
    isHardware: boolean("is_hardware").default(false),
    isSupplies: boolean("is_supplies").default(false),
    dataSourceHardware: text("data_source_hardware"),
    dataSourceSss: text("data_source_sss"),
    effortHardware: text("effort_hardware"),
    effortSss: text("effort_sss"),
    modelOrSku: text("model_or_sku"),
    description: text("description"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    importedFrom: text("imported_from").notNull(),
    importSourceHash: varchar("import_source_hash", { length: 64 }),
  },
  (table) => ({
    uqAttributeName: uniqueIndex("uq_zebra_attr_name").on(table.attributeName),
    idxExcelRow: index("idx_zebra_attr_excel_row").on(table.excelRowNumber),
    idxIsHardware: index("idx_zebra_attr_hardware").on(table.isHardware),
    idxIsSupplies: index("idx_zebra_attr_supplies").on(table.isSupplies),
    idxDataSourceHw: index("idx_zebra_attr_ds_hw").on(table.dataSourceHardware),
    idxDataSourceSss: index("idx_zebra_attr_ds_sss").on(table.dataSourceSss),
  })
);

/**
 * Zebra-Provided Properties Catalog - Property metadata registry
 *
 * Defines all 22 properties from the Excel spreadsheet with complete
 * traceability to source coordinates. Each property gets a normalized
 * name and tracks its Excel column position.
 *
 * Property names formatted as: "{normalized_name} ({excel_column})"
 * Example: "hardware (C)", "data_source_hardware (H)"
 */
export const zebraProvidedPropertiesCatalog = pgTable(
  "zebra_provided_properties_catalog",
  {
    id: serial("id").primaryKey(),
    propertyName: varchar("property_name", { length: 255 }).notNull(),
    propertySlug: varchar("property_slug", { length: 255 }).notNull(),
    excelColumnLetter: varchar("excel_column_letter", { length: 2 }).notNull(),
    excelColumnPosition: integer("excel_column_position").notNull(),
    excelHeaderValue: text("excel_header_value").notNull(),
    dataType: varchar("data_type", { length: 50 }).notNull(),
    storageStrategy: varchar("storage_strategy", { length: 20 }).notNull(),
    populationPercent: integer("population_percent").notNull(),
    wideColumnName: varchar("wide_column_name", { length: 255 }),
    eavPropertyKey: varchar("eav_property_key", { length: 255 }),
    description: text("description"),
    exampleValues: text("example_values"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uqPropertySlug: uniqueIndex("uq_zebra_prop_slug").on(table.propertySlug),
    uqExcelColumn: uniqueIndex("uq_zebra_prop_excel_col").on(
      table.excelColumnLetter
    ),
    uqExcelPosition: uniqueIndex("uq_zebra_prop_excel_pos").on(
      table.excelColumnPosition
    ),
    idxStorageStrategy: index("idx_zebra_prop_storage").on(
      table.storageStrategy
    ),
    idxDataType: index("idx_zebra_prop_datatype").on(table.dataType),
  })
);

/**
 * Zebra-Provided Attribute Values - EAV table for sparse properties
 *
 * Stores properties with <40% population rate in Entity-Attribute-Value format.
 * Each row represents one property value for one attribute.
 *
 * VALUE PRESERVATION STRATEGY:
 * - original_value: Always stored as TEXT (raw Excel value)
 * - typed columns (boolean_value, text_value, etc.): Normalized/parsed values
 * - is_normalized: Flag indicating if normalization was applied
 *
 * This dual-storage approach enables:
 * 1. Auditing: Compare original vs normalized values
 * 2. Re-normalization: Reprocess original values with improved logic
 * 3. Type safety: Query typed columns with proper NULL semantics
 */
export const zebraProvidedAttributeValues = pgTable(
  "zebra_provided_attribute_values",
  {
    id: serial("id").primaryKey(),
    attributeId: integer("attribute_id")
      .notNull()
      .references(() => zebraProvidedAttributes.id, { onDelete: "cascade" }),
    propertyId: integer("property_id")
      .notNull()
      .references(() => zebraProvidedPropertiesCatalog.id, {
        onDelete: "restrict",
      }),
    excelCellRef: varchar("excel_cell_ref", { length: 10 }).notNull(),
    originalValue: text("original_value").notNull(),
    booleanValue: boolean("boolean_value"),
    textValue: text("text_value"),
    categoricalValue: varchar("categorical_value", { length: 255 }),
    numericValue: integer("numeric_value"),
    isNormalized: boolean("is_normalized").default(false).notNull(),
    normalizationNote: text("normalization_note"),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    uqAttributeProperty: uniqueIndex("uq_zebra_attr_prop_value").on(
      table.attributeId,
      table.propertyId
    ),
    idxAttributeId: index("idx_zebra_value_attr").on(table.attributeId),
    idxPropertyId: index("idx_zebra_value_prop").on(table.propertyId),
    idxExcelCellRef: index("idx_zebra_value_cell_ref").on(table.excelCellRef),
    idxBooleanValue: index("idx_zebra_value_bool").on(table.booleanValue),
    idxCategoricalValue: index("idx_zebra_value_cat").on(
      table.categoricalValue
    ),
    idxAttrProp: index("idx_zebra_value_attr_prop").on(
      table.attributeId,
      table.propertyId
    ),
  })
);

/**
 * HTB Attribute Mapping - Zebra-Provided Mapping Table
 *
 * Stores attribute mapping data from HTB Attribute Mapping XLSX.
 * Contains 25 columns mapping attributes between PIM, AEM, and other systems.
 * Key column is attribute_name_for_htb (Column A) used for embeddings and matching.
 *
 * This table provides cross-system attribute mappings for:
 * - PIM attributes and validation rules
 * - AEM Content Fragment attributes and labels
 * - Data type mappings and length validations
 * - Product categorization and content type assignments
 */
export const htbAttributeMappingZebraProvided = pgTable(
  "htb_attribute_mapping_zebra_provided",
  {
    id: serial("id").primaryKey(),
    attributeNameForHtb: text("attribute_name_for_htb").notNull(),
    pimAttribute: text("pim_attribute"),
    pimDataType: text("pim_data_type"),
    lengthValidationInPim: text("length_validation_in_pim"),
    otherValidationInPim: text("other_validation_in_pim"),
    aemCfAttributeName: text("aem_cf_attribute_name"),
    aemCfLabel: text("aem_cf_label"),
    aemCfDataType: text("aem_cf_data_type"),
    aemLengthValidation: text("aem_length_validation"),
    note: text("note"),
    originalSource: text("original_source"),
    synonym: text("synonym"),
    required: text("required"),
    productCategory: text("product_category"),
    luisaCheckPimAttributes: text("luisa_check_pim_attributes"),
    michelleCheckPimAttributes: text("michelle_check_pim_attributes"),
    length: text("length"),
    attributeFamily: text("attribute_family"),
    whereCfUsed: text("where_cf_used"),
    whereDataUsed: text("where_data_used"),
    notes: text("notes"),
    cleanupAction: text("cleanup_action"),
    reviewBy: text("review_by"),
    contentType: text("content_type"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    attributeNameIdx: uniqueIndex("htb_attribute_name_idx").on(
      table.attributeNameForHtb
    ),
    idxPimAttribute: index("idx_htb_pim_attribute").on(table.pimAttribute),
    idxAemCfAttribute: index("idx_htb_aem_cf_attribute").on(
      table.aemCfAttributeName
    ),
    idxProductCategory: index("idx_htb_product_category").on(
      table.productCategory
    ),
    idxContentType: index("idx_htb_content_type").on(table.contentType),
  })
);

export type ZebraProvidedAttribute =
  typeof zebraProvidedAttributes.$inferSelect;
export type NewZebraProvidedAttribute =
  typeof zebraProvidedAttributes.$inferInsert;
export type ZebraProvidedPropertyCatalog =
  typeof zebraProvidedPropertiesCatalog.$inferSelect;
export type NewZebraProvidedPropertyCatalog =
  typeof zebraProvidedPropertiesCatalog.$inferInsert;
export type ZebraProvidedAttributeValue =
  typeof zebraProvidedAttributeValues.$inferSelect;
export type NewZebraProvidedAttributeValue =
  typeof zebraProvidedAttributeValues.$inferInsert;
export type HtbAttributeMappingZebraProvided =
  typeof htbAttributeMappingZebraProvided.$inferSelect;
export type NewHtbAttributeMappingZebraProvided =
  typeof htbAttributeMappingZebraProvided.$inferInsert;
