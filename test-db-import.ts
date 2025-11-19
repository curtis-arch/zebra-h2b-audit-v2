import { count, eq } from "drizzle-orm";
import { configFile, db } from "./packages/db/src/index";

async function testFromWebApp() {
  console.log("Testing database access from web app context...\n");

  const fileCount = await db.select({ value: count() }).from(configFile);
  console.log("✅ config_file count:", fileCount[0].value);

  const baseModels = await db
    .selectDistinct({ baseModel: configFile.baseModel })
    .from(configFile)
    .where(eq(configFile.specStyle, "matrix"))
    .limit(10);

  const models = baseModels
    .map((m) => m.baseModel)
    .filter(Boolean)
    .join(", ");
  console.log("✅ Sample base models:", models);

  console.log("\n🎉 Database package is ready to use in web app!");
}

testFromWebApp();
