"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add entity_id column for polymorphic associations
    await queryInterface.addColumn("TransactionDetails", "entity_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0, // Temporary default value to allow NOT NULL constraint
    });

    // Add entity_type column for polymorphic associations
    await queryInterface.addColumn("TransactionDetails", "entity_type", {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: "sales_invoice", // Temporary default value to allow NOT NULL constraint
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the columns in case of rollback
    await queryInterface.removeColumn("TransactionDetails", "entity_type");
    await queryInterface.removeColumn("TransactionDetails", "entity_id");
  },
};
