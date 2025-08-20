const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

console.log("db host: ", process.env.DB_HOST);

// Map domains to their respective databases
const tenants = {
  "cnh.zendensolutions.store": process.env.DB_CNH,
  "rusmaelite.zendensolutions.store": process.env.DB_RUSMAELITE,
  "demo.zendensolutions.store": process.env.DB_DEMO,
  "pnn.zendensolutions.store": process.env.DB_PNN,
  "hichem.zendensolutions.store": process.env.DB_HICHEM,
};

const isLocalhost = process.env.DB_HOST === "localhost";

// Default config without the database name
const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: "postgres",
  dialectOptions: isLocalhost
    ? {}
    : {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
};

// Export the configuration with a default database
// We'll handle tenant-specific databases in the models/index.js
module.exports = {
  tenants,
  development: {
    ...baseConfig,
    database: process.env.DB_DEFAULT,
  },
  test: {
    ...baseConfig,
    database: process.env.DB_DEFAULT,
  },
  production: {
    ...baseConfig,
    database: process.env.DB_DEFAULT,
  },
};
