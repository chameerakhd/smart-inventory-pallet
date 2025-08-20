const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const db = require("./models");

// All seeder functions
const seedCashDrawers = async (sequelize, models) => {
  const { CashDrawer } = models;

  const cashDrawers = [
    {
      name: "Main Office Cash Drawer",
      location: "Main Office",
      current_balance: 2000.0,
      status: "open",
      last_counted: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: "Sales Floor Cash Drawer",
      location: "Sales Department",
      current_balance: 1000.0,
      status: "open",
      last_counted: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  for (const data of cashDrawers) {
    const existingEntry = await CashDrawer.findOne({
      where: { name: data.name },
    });

    if (!existingEntry) {
      await CashDrawer.create(data);
      console.log(`Cash drawer '${data.name}' added.`);
    } else {
      console.log(`Cash drawer '${data.name}' already exists.`);
    }
  }
};

const seedPaymentMethods = async (sequelize, models) => {
  const { PaymentMethod } = models;

  // First, let's check what the PaymentMethod model allows
  console.log("Checking PaymentMethod model structure...");

  try {
    // Get model attributes to understand the validation rules
    const attributes = PaymentMethod.rawAttributes;
    if (
      attributes.name &&
      attributes.name.validate &&
      attributes.name.validate.isIn
    ) {
      console.log(
        "Allowed payment method names:",
        attributes.name.validate.isIn
      );
    }
  } catch (error) {
    console.log("Could not retrieve model validation rules");
  }

  // FIXED: Use the exact values from your PaymentMethod model validation
  // Based on your model: validate: { isIn: [["cash", "check", "credit", "bank transfer"]] }
  const paymentMethods = [
    {
      name: "cash", // ✓ Valid
      description: "Cash payment",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: "check", // ✓ Valid
      description: "Check payment",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: "credit", // ✓ Valid (not "credit_card")
      description: "Credit card payment",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      name: "bank transfer", // ✓ Valid (with space, not underscore)
      description: "Bank transfer or direct deposit",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  for (const data of paymentMethods) {
    try {
      const existingEntry = await PaymentMethod.findOne({
        where: { name: data.name },
      });

      if (!existingEntry) {
        await PaymentMethod.create(data);
        console.log(`Payment method '${data.name}' added.`);
      } else {
        console.log(`Payment method '${data.name}' already exists.`);
      }
    } catch (error) {
      console.error(
        `Error creating payment method '${data.name}':`,
        error.message
      );
    }
  }
};

const seedTransactionTypes = async (sequelize, models) => {
  const { TransactionType } = models;

  // Only provide type_name, remove the name field entirely
  const transactionTypes = [
    {
      type_name: "Customer Payment",
      flow_direction: "in",
      description: "Payment received from a customer",
    },
    {
      type_name: "Sales Invoice",
      flow_direction: "in",
      description: "Invoice for goods sold to a customer",
    },
    {
      type_name: "Supplier Payment",
      flow_direction: "out",
      description: "Payment made to a supplier",
    },
    {
      type_name: "Purchase Invoice",
      flow_direction: "out",
      description: "Invoice for goods purchased from a supplier",
    },
    {
      type_name: "Internal Transfer",
      flow_direction: "transfer",
      description: "Transfer between accounts or cash drawers",
    },
    {
      type_name: "Cash Deposit",
      flow_direction: "in",
      description: "Cash deposited into a cash drawer or bank account",
    },
    {
      type_name: "Cash Withdrawal",
      flow_direction: "out",
      description: "Cash withdrawn from a cash drawer or bank account",
    },
    {
      type_name: "General Expense",
      flow_direction: "out",
      description: "General business expense",
    },
    {
      type_name: "Other Income",
      flow_direction: "in",
      description: "Other business income",
    },
    {
      type_name: "Customer Credit Payment",
      flow_direction: "in",
      description: "Payment received from customer to pay off credit balance",
    },
  ];

  for (const data of transactionTypes) {
    try {
      const existingEntry = await TransactionType.findOne({
        where: { type_name: data.type_name },
      });

      if (!existingEntry) {
        // Add timestamps when creating
        const recordWithTimestamps = {
          ...data,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await TransactionType.create(recordWithTimestamps);
        console.log(`Transaction type '${data.type_name}' added.`);
      } else {
        console.log(`Transaction type '${data.type_name}' already exists.`);
      }
    } catch (error) {
      console.error(
        `Error seeding transaction type '${data.type_name}':`,
        error.message
      );
    }
  }
};

// BONUS: Add BankAccount seeder since you have the model
const seedBankAccounts = async (sequelize, models) => {
  const { BankAccount } = models;

  const bankAccounts = [
    {
      bank_name: "Main Business Bank",
      account_number: "123456789",
      account_name: "Business Checking Account",
      current_balance: 25000.0,
      account_type: "checking",
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      bank_name: "Business Savings Bank",
      account_number: "987654321",
      account_name: "Business Savings Account",
      current_balance: 50000.0,
      account_type: "savings",
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  for (const data of bankAccounts) {
    try {
      const existingEntry = await BankAccount.findOne({
        where: {
          bank_name: data.bank_name,
          account_number: data.account_number,
        },
      });

      if (!existingEntry) {
        await BankAccount.create(data);
        console.log(`Bank account '${data.account_name}' added.`);
      } else {
        console.log(`Bank account '${data.account_name}' already exists.`);
      }
    } catch (error) {
      console.error(
        `Error creating bank account '${data.account_name}':`,
        error.message
      );
    }
  }
};

// Function to debug PaymentMethod model constraints
const debugPaymentMethodModel = async (models) => {
  const { PaymentMethod } = models;

  console.log("\n=== Debugging PaymentMethod Model ===");

  try {
    // Try to get the model definition
    const attributes = PaymentMethod.rawAttributes;

    if (attributes.name) {
      console.log(
        "Name field configuration:",
        JSON.stringify(attributes.name, null, 2)
      );

      if (attributes.name.validate && attributes.name.validate.isIn) {
        console.log(
          "Allowed values for 'name':",
          attributes.name.validate.isIn
        );
        return attributes.name.validate.isIn;
      }
    }

    // Try to query existing records to see what values are already there
    const existingPaymentMethods = await PaymentMethod.findAll({
      attributes: ["name"],
      limit: 10,
    });

    if (existingPaymentMethods.length > 0) {
      console.log(
        "Existing payment method names:",
        existingPaymentMethods.map((pm) => pm.name)
      );
    }
  } catch (error) {
    console.log("Could not debug PaymentMethod model:", error.message);
  }

  console.log("=== End Debug ===\n");
  return null;
};

// Main seeder function
const seedAllTenantDatabases = async () => {
  try {
    // Get the tenants configuration
    const tenants = require("./config/config.js").tenants;

    console.log("Starting multi-tenant database seeding...");

    // For each tenant, run all seeders
    for (const tenant in tenants) {
      console.log(`\n=== Seeding database for tenant: ${tenant} ===`);

      // Get the database instance for this tenant
      const instance = db.getSequelizeForTenant(tenant);
      const { sequelize, models } = instance;

      try {
        await sequelize.authenticate();
        console.log(`✓ Connected to database for tenant: ${tenant}`);

        // Debug PaymentMethod model first
        await debugPaymentMethodModel(models);

        // Run all seeders in the correct order
        console.log("Seeding Cash Drawers...");
        await seedCashDrawers(sequelize, models);

        console.log("Seeding Payment Methods...");
        await seedPaymentMethods(sequelize, models);

        console.log("Seeding Transaction Types...");
        await seedTransactionTypes(sequelize, models);

        console.log("Seeding Bank Accounts...");
        await seedBankAccounts(sequelize, models);

        console.log(`✓ All seeders completed for tenant: ${tenant}`);
      } catch (error) {
        console.error(`✗ Error seeding database for tenant ${tenant}:`, error);
      }
    }

    console.log("\n=== Multi-tenant seeding complete! ===");
  } catch (error) {
    console.error("Error in multi-tenant seeding:", error);
  } finally {
    process.exit(0);
  }
};

// Function to seed specific tenant
const seedSpecificTenant = async (tenantName) => {
  try {
    console.log(
      `\n=== Seeding database for specific tenant: ${tenantName} ===`
    );

    // Get the database instance for this tenant
    const instance = db.getSequelizeForTenant(tenantName);
    const { sequelize, models } = instance;

    await sequelize.authenticate();
    console.log(`✓ Connected to database for tenant: ${tenantName}`);

    // Debug PaymentMethod model first
    await debugPaymentMethodModel(models);

    // Run all seeders in the correct order
    console.log("Seeding Cash Drawers...");
    await seedCashDrawers(sequelize, models);

    console.log("Seeding Payment Methods...");
    await seedPaymentMethods(sequelize, models);

    console.log("Seeding Transaction Types...");
    await seedTransactionTypes(sequelize, models);

    console.log("Seeding Bank Accounts...");
    await seedBankAccounts(sequelize, models);

    console.log(`✓ All seeders completed for tenant: ${tenantName}`);
  } catch (error) {
    console.error(`✗ Error seeding database for tenant ${tenantName}:`, error);
  } finally {
    process.exit(0);
  }
};

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0 && args[0] === "--tenant") {
  if (args[1]) {
    seedSpecificTenant(args[1]);
  } else {
    console.error(
      "Please specify a tenant name: node seed-all-tenants.js --tenant TENANT_NAME"
    );
    process.exit(1);
  }
} else {
  seedAllTenantDatabases();
}
