"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add notes column to TransactionDetails table
    await queryInterface.addColumn("TransactionDetails", "notes", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the column in case of rollback
    await queryInterface.removeColumn("TransactionDetails", "notes");
  },
};
