/**
 * Field Label Mappings
 *
 * @deprecated This mapping is DEPRECATED and should no longer be used.
 * All queries now use exact matching on raw attribute_label values directly from the database.
 * "Different is different!" - "Memory" and "memory" are treated as separate fields.
 *
 * Kept for backwards compatibility only. Will be removed in a future version.
 *
 * Previously mapped logical field names to their raw attribute_label values from the database.
 * Used for field population analysis and gap detection.
 *
 * NOTE: These are raw values with original casing preserved. Queries use LOWER()
 * for case-insensitive matching to handle variants like "Country code" vs "Country Code".
 */
export const FIELD_LABEL_MAPPINGS = {
  Memory: [
    "Memory",
    "Memory / Flash",
    "Memory (RAM/Flash/SD slot)",
    "Memory (RAM/ROM)",
    "RAM/Flash Memory",
    "CPU/Memory",
    "CPU Memory",
    "CPU memory",
    "CPU & Memory",
    "CPU and Memory",
    "Flash Memory",
    "Memory & Battery Option",
  ],
  Series: ["Series"],
  Family: ["Family", "Product Family"],
  "Print Width": ["Print Width"],
  "Character Set": ["Character Set"],
  Interface: [
    "Interface",
    "Interface (Connectivity)",
    "Interface / Imaging Option",
    "Interface Cable Options",
    "Interface Options",
    "Interface Out",
  ],
  "Media Type": ["Media Type", "Media Options"],
  "Label Sensor": ["Label Sensor"],
  "Country Code": [
    "Country Code",
    "Country",
    "Country/Compliance",
    "Country / Compliance",
    "Country or Custom",
    "Country Code/Custom",
    "Country Code/Custom Version",
    "Country/Custom",
    "Country code", // lowercase variant found in data
  ],
  "Channel Type": ["Channel Type"],
} as const;

export type FieldName = keyof typeof FIELD_LABEL_MAPPINGS;

/**
 * Gap Analysis Data
 *
 * Files that were in the source directory but not successfully ingested into the database.
 * Total files: 300, Ingested: 289, Gap: 11
 */
export const GAP_ANALYSIS = {
  totalSourceFiles: 300,
  totalIngested: 289,
  gap: 11,
  missingFiles: {
    supplies: [
      "supplies-mps-delta-configuration-matrix-global-en-us.xlsx",
      "supplies-mps-details-configuration-matrix-global-en-us.xlsx",
    ],
    filenameIssues: [
      "ds3600-li3600-congifuration-matrix-en-us.csv",
      "ds3600-li3600-congifuration-matrix-en-us.xlsm",
    ],
    parserFailures: [
      "ds2278-hc-configuration-matrix-en-us.csv",
      "ds6878-configuration-matrix.csv",
      "ds6878-fips-configuration-matrix.csv",
      "ls2208-configuration-matrix-en-us.csv",
      "mc709x-haz-loc-configuration-matrix-en-us.csv",
      "mp7000-configuration-matrix-en-us.csv",
      "ms4717-configuration-matrix-en-us.csv",
    ],
  },
} as const;
