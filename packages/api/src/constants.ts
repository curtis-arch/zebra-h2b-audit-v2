/**
 * Field Label Mappings
 *
 * Maps logical field names to their database normalized_label representations.
 * Used for field population analysis and gap detection.
 */
export const FIELD_LABEL_MAPPINGS = {
  Memory: [
    "memory",
    "memory / flash",
    "memory (ram/flash/sd slot)",
    "memory (ram/rom)",
    "ram",
    "ram & storage",
    "ram/flash memory",
    "cpu/memory",
    "cpu memory",
  ],
  Series: ["series"],
  Family: ["family", "product family"],
  "Print Width": ["print width"],
  "Character Set": ["character set"],
  Interface: [
    "interface",
    "interface (connectivity)",
    "interface / imaging option",
    "interface cable options",
    "interface options",
    "interface out",
  ],
  "Media Type": ["media type", "media options"],
  "Label Sensor": ["label sensor"],
  "Country Code": [
    "country code",
    "country",
    "country/compliance",
    "country / compliance",
    "country or custom",
    "country code/custom",
    "county code/custom",
  ],
  "Channel Type": ["channel type"],
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
