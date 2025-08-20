// scripts/clear-test-data.js
const { Sequelize } = require("sequelize");
const config = require("../config/config.js")[
  process.env.NODE_ENV || "development"
];

async function clearTestData() {
  const sequelize = new Sequelize(config);

  try {
    console.log("db: ", config.database);

    // Get all table names
    const [results] = await sequelize.query(`
      SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    `);

    const tables = results.map((r) => r.tablename);
    console.log("Found tables:", tables);

    // Use a transaction to ensure all operations succeed or fail together
    await sequelize.transaction(async (t) => {
      // Truncate all tables directly
      for (const table of tables) {
        // Skip system tables if there are any
        if (!table.startsWith("pg_") && !table.startsWith("sql_")) {
          console.log(`Truncating table: ${table}`);
          await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`, {
            transaction: t,
          });
        }
      }
    });

    console.log("All test data cleared successfully");
  } catch (error) {
    console.error("Error clearing test data:", error);
  } finally {
    await sequelize.close();
  }
}

clearTestData();
