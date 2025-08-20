"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("PaymentMethods", [
      {
        name: "Cash",
        description: "Cash payment",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Check",
        description: "Check payment",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Bank Transfer",
        description: "Bank transfer or direct deposit",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Credit Card",
        description: "Credit card payment",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        name: "Mobile Payment",
        description: "Mobile payment methods",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("PaymentMethods", null, {});
  },
};
