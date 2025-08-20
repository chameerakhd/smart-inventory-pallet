"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Fix TransactionTypes - add 'name' column to match what frontend expects
    await queryInterface.addColumn("TransactionTypes", "name", {
      type: Sequelize.STRING(50),
      allowNull: true, // Making it nullable so we can migrate data
    });

    // Copy data from type_name to name
    await queryInterface.sequelize.query(`
      UPDATE "TransactionTypes" 
      SET name = type_name 
      WHERE name IS NULL
    `);

    // Make name not null after migration
    await queryInterface.changeColumn("TransactionTypes", "name", {
      type: Sequelize.STRING(50),
      allowNull: false,
    });

    // Add missing columns to SalesInvoices - change to lorry_id to match the Lorry model
    await queryInterface.addColumn("SalesInvoices", "lorry_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Lorries",
        key: "lorry_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    // Add the purchase_id column to PurchaseInvoices if it's needed
    await queryInterface.addColumn("PurchaseInvoices", "purchase_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add order_id column to SalesInvoices if it's needed (common in sales systems)
    await queryInterface.addColumn("SalesInvoices", "order_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add common fields that might be missing
    await queryInterface.addColumn("Transactions", "customer_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Customers",
        key: "customer_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });

    await queryInterface.addColumn("Transactions", "supplier_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "Suppliers",
        key: "supplier_id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert all changes in reverse order
    await queryInterface.removeColumn("Transactions", "supplier_id");
    await queryInterface.removeColumn("Transactions", "customer_id");
    await queryInterface.removeColumn("SalesInvoices", "order_id");
    await queryInterface.removeColumn("PurchaseInvoices", "purchase_id");
    await queryInterface.removeColumn("SalesInvoices", "lorry_id");

    // Don't remove the name column to avoid breaking things, but we can make it nullable
    await queryInterface.changeColumn("TransactionTypes", "name", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },
};
