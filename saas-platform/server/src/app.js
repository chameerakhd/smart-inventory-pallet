const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const cors = require("cors");
const express = require("express");
const routes = require("./routes");

const app = express();
app.use(express.json());

// Import db with our enhanced getSequelizeForTenant function
const db = require("./models");

// Middleware to set tenant for each request and prepare the right database connection
app.use((req, res, next) => {
  const tenant = req.hostname;
  process.env.CURRENT_TENANT = tenant;
  console.log(`Current Tenant: ${process.env.CURRENT_TENANT}`);

  // Get the Sequelize instance for this tenant
  const tenantDb = db.getSequelizeForTenant(tenant);

  // Attach the tenant-specific models to the request for easy access in routes
  req.db = tenantDb.models;
  req.sequelize = tenantDb.sequelize;

  next();
});

// Dynamic CORS Configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://cnh-distributors-client.onrender.com",
  "http://cnh.zendensolutions.store",
  "https://cnh.zendensolutions.store",
  "http://rusmaelite.zendensolutions.store",
  "https://rusmaelite.zendensolutions.store",
  "http://demo.zendensolutions.store",
  "https://demo.zendensolutions.store",
  "http://pnn.zendensolutions.store",
  "https://pnn.zendensolutions.store",
  "http://hichem.zendensolutions.store",
  "https://hichem.zendensolutions.store",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Routes
app.use("/api", routes);

// We don't need to sync on startup anymore as we're creating connections dynamically
// Each tenant connection will be synced when it's first created

// Sync all models with the database
const syncAllDatabases = async () => {
  try {
    // Get the tenants configuration
    const tenants = require("./config/config.js").tenants;

    // For each tenant, sync their database
    for (const tenant in tenants) {
      console.log(`Syncing database for tenant: ${tenant}`);
      const instance = db.getSequelizeForTenant(tenant);
      await instance.sequelize.sync();
      console.log(`Database synced successfully for tenant: ${tenant}`);
    }

    console.log("All database tables created successfully");
  } catch (error) {
    console.error("Error syncing databases:", error);
    process.exit(1); // Exit with error code if sync fails
  }
};

// Call the sync function
syncAllDatabases();

module.exports = app;
