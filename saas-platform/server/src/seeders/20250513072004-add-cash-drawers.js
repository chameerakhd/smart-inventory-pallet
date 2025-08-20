"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add two cash drawers
    await queryInterface.bulkInsert(
      "CashDrawers",
      [
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
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove the cash drawers
    await queryInterface.bulkDelete(
      "CashDrawers",
      {
        name: {
          [Sequelize.Op.in]: [
            "Main Office Cash Drawer",
            "Sales Floor Cash Drawer",
          ],
        },
      },
      {}
    );
  },
};
