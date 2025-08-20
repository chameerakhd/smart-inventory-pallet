"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, let's create the reference tables
    await queryInterface.createTable("TransactionTypes", {
      type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      type_name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      flow_direction: {
        type: Sequelize.ENUM("in", "out", "transfer"),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("PaymentMethods", {
      method_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create storage tables (where money is held)
    await queryInterface.createTable("BankAccounts", {
      account_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      account_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      account_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      bank_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      branch_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      current_balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      account_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("CashDrawers", {
      drawer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      current_balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.ENUM("open", "closed"),
        allowNull: false,
        defaultValue: "closed",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create entities tables
    await queryInterface.createTable("Customers", {
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      credit_limit: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      outstanding_balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("Suppliers", {
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      outstanding_balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create transaction tables
    await queryInterface.createTable("Transactions", {
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      reference_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      transaction_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      transaction_time: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      transaction_type_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TransactionTypes",
          key: "type_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      payment_method_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "PaymentMethods",
          key: "method_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      bank_account_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "BankAccounts",
          key: "account_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      cash_drawer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "CashDrawers",
          key: "drawer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "completed",
      },
      reference_document: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("TransactionDetails", {
      detail_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Transactions",
          key: "transaction_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Customers",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Suppliers",
          key: "supplier_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Create invoice tables
    await queryInterface.createTable("SalesInvoices", {
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      invoice_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      customer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Customers",
          key: "customer_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "unpaid",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.createTable("PurchaseInvoices", {
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      invoice_number: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      supplier_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Suppliers",
          key: "supplier_id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },
      invoice_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      paid_amount: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "unpaid",
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // Seed initial data
    await queryInterface.bulkInsert("TransactionTypes", [
      {
        type_name: "Customer Payment",
        flow_direction: "in",
        description: "Payment received from customer",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Supplier Payment",
        flow_direction: "out",
        description: "Payment made to supplier",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Bank Deposit",
        flow_direction: "in",
        description: "Deposit funds into bank account",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Bank Withdrawal",
        flow_direction: "out",
        description: "Withdraw funds from bank account",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Bank Transfer",
        flow_direction: "transfer",
        description: "Transfer between accounts",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("PaymentMethods", [
      {
        name: "Cash",
        description: "Cash payment",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Bank Transfer",
        description: "Bank transfer payment",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Check",
        description: "Check payment",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Credit Card",
        description: "Credit card payment",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    // Create a default bank account and cash drawer
    await queryInterface.bulkInsert("BankAccounts", [
      {
        account_name: "Main Business Account",
        account_number: "1234567890",
        bank_name: "National Bank",
        branch_name: "Main Branch",
        current_balance: 10000,
        account_type: "Business Checking",
        active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await queryInterface.bulkInsert("CashDrawers", [
      {
        name: "Main Cash Drawer",
        location: "Main Office",
        current_balance: 1000,
        status: "open",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order to avoid foreign key constraints
    await queryInterface.dropTable("PurchaseInvoices");
    await queryInterface.dropTable("SalesInvoices");
    await queryInterface.dropTable("TransactionDetails");
    await queryInterface.dropTable("Transactions");
    await queryInterface.dropTable("Suppliers");
    await queryInterface.dropTable("Customers");
    await queryInterface.dropTable("CashDrawers");
    await queryInterface.dropTable("BankAccounts");
    await queryInterface.dropTable("PaymentMethods");
    await queryInterface.dropTable("TransactionTypes");
  },
};
