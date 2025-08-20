"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transactions = [];

    // Add columns to StockInventory table
    transactions.push(
      queryInterface.addColumn("StockInventory", "empty_cases_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn("StockInventory", "empty_bottles_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn("StockInventory", "expired_bottles_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn(
        "StockInventory",
        "total_expired_bottles_value",
        {
          type: Sequelize.FLOAT,
          allowNull: false,
          defaultValue: 0,
        }
      )
    );

    // Add columns to UnloadingDetails table
    transactions.push(
      queryInterface.addColumn("UnloadingDetails", "empty_cases_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn("UnloadingDetails", "empty_bottles_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn("UnloadingDetails", "expired_bottles_qty", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      })
    );

    transactions.push(
      queryInterface.addColumn("UnloadingDetails", "expired_bottle_value", {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 0,
      })
    );

    // Execute all transactions
    return Promise.all(transactions);
  },

  down: async (queryInterface, Sequelize) => {
    const transactions = [];

    // Remove columns from StockInventory table
    transactions.push(
      queryInterface.removeColumn("StockInventory", "empty_cases_qty")
    );
    transactions.push(
      queryInterface.removeColumn("StockInventory", "empty_bottles_qty")
    );
    transactions.push(
      queryInterface.removeColumn("StockInventory", "expired_bottles_qty")
    );
    transactions.push(
      queryInterface.removeColumn(
        "StockInventory",
        "total_expired_bottles_value"
      )
    );

    // Remove columns from UnloadingDetails table
    transactions.push(
      queryInterface.removeColumn("UnloadingDetails", "empty_cases_qty")
    );
    transactions.push(
      queryInterface.removeColumn("UnloadingDetails", "empty_bottles_qty")
    );
    transactions.push(
      queryInterface.removeColumn("UnloadingDetails", "expired_bottles_qty")
    );
    transactions.push(
      queryInterface.removeColumn("UnloadingDetails", "expired_bottle_value")
    );

    // Execute all transactions
    return Promise.all(transactions);
  },
};
