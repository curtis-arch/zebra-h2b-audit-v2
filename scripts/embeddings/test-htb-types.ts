import type {
  HtbAttributeMappingZebraProvided,
  NewHtbAttributeMappingZebraProvided,
} from "@zebra-h2b-audit-v2/db/schema/zebra";

// Test that types are correctly inferred
const testInsert: NewHtbAttributeMappingZebraProvided = {
  attributeNameForHtb: "test",
  pimAttribute: "test_pim",
  productCategory: "hardware",
};

const testSelect: HtbAttributeMappingZebraProvided = {
  id: 1,
  attributeNameForHtb: "test",
  pimAttribute: "test_pim",
  pimDataType: null,
  lengthValidationInPim: null,
  otherValidationInPim: null,
  aemCfAttributeName: null,
  aemCfLabel: null,
  aemCfDataType: null,
  aemLengthValidation: null,
  note: null,
  originalSource: null,
  synonym: null,
  required: null,
  productCategory: "hardware",
  luisaCheckPimAttributes: null,
  michelleCheckPimAttributes: null,
  length: null,
  attributeFamily: null,
  whereCfUsed: null,
  whereDataUsed: null,
  notes: null,
  cleanupAction: null,
  reviewBy: null,
  contentType: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log("✓ TypeScript types are correctly inferred");
console.log("\nNewHtbAttributeMappingZebraProvided keys:");
console.log(Object.keys(testInsert).sort());

console.log("\nHtbAttributeMappingZebraProvided keys:");
console.log(Object.keys(testSelect).sort());

console.log("\n✅ Type test passed");
