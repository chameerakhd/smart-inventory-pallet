"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add last_counted column to CashDrawers table
    await queryInterface.addColumn("CashDrawers", "last_counted", {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the column in case of rollback
    await queryInterface.removeColumn("CashDrawers", "last_counted");
  },
};
