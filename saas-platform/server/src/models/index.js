"use strict";

const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const process = require("process");
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || "development";
const config = require(__dirname + "/../config/config.js")[env];
const tenants = require(__dirname + "/../config/config.js").tenants;
const db = {};

// Store Sequelize instances for each tenant
const sequelizeInstances = {};

// Get or create Sequelize instance for a tenant
const getSequelizeForTenant = (tenant) => {
  // If we already have an instance for this tenant, return it
  if (sequelizeInstances[tenant]) {
    return sequelizeInstances[tenant];
  }

  // Determine database name based on tenant
  const dbName = tenants[tenant] || config.database;
  console.log(`Creating connection for tenant: ${tenant}, database: ${dbName}`);

  // Create a new Sequelize instance
  const sequelize = new Sequelize(dbName, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions,
    logging: console.log,
  });

  // Store the instance
  sequelizeInstances[tenant] = { sequelize, models: {} };

  // Load models for this instance
  fs.readdirSync(__dirname)
    .filter((file) => {
      return (
        file.indexOf(".") !== 0 &&
        file !== basename &&
        file.slice(-3) === ".js" &&
        file.indexOf(".test.js") === -1
      );
    })
    .forEach((file) => {
      const model = require(path.join(__dirname, file))(
        sequelize,
        Sequelize.DataTypes
      );
      sequelizeInstances[tenant].models[model.name] = model;
    });

  // Set up associations
  Object.keys(sequelizeInstances[tenant].models).forEach((modelName) => {
    if (sequelizeInstances[tenant].models[modelName].associate) {
      sequelizeInstances[tenant].models[modelName].associate(
        sequelizeInstances[tenant].models
      );
    }
  });

  return sequelizeInstances[tenant];
};

// Initialize with a default connection for startup
const defaultTenant = "default";
const defaultInstance = getSequelizeForTenant(defaultTenant);

db.sequelize = defaultInstance.sequelize;
db.Sequelize = Sequelize;
db.getSequelizeForTenant = getSequelizeForTenant;

// Add models from default instance to db object for backward compatibility
Object.keys(defaultInstance.models).forEach((modelName) => {
  db[modelName] = defaultInstance.models[modelName];
});

module.exports = db;
