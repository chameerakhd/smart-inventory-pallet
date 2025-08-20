"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert("TransactionTypes", [
      {
        type_name: "Customer Payment",
        name: "Customer Payment",
        flow_direction: "in",
        description: "Payment received from a customer",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Sales Invoice",
        name: "Sales Invoice",
        flow_direction: "in",
        description: "Invoice for goods sold to a customer",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Supplier Payment",
        name: "Supplier Payment",
        flow_direction: "out",
        description: "Payment made to a supplier",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Purchase Invoice",
        name: "Purchase Invoice",
        flow_direction: "out",
        description: "Invoice for goods purchased from a supplier",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Internal Transfer",
        name: "Internal Transfer",
        flow_direction: "transfer",
        description: "Transfer between accounts or cash drawers",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Cash Deposit",
        name: "Cash Deposit",
        flow_direction: "in",
        description: "Cash deposited into a cash drawer or bank account",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Cash Withdrawal",
        name: "Cash Withdrawal",
        flow_direction: "out",
        description: "Cash withdrawn from a cash drawer or bank account",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "General Expense",
        name: "General Expense",
        flow_direction: "out",
        description: "General business expense",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Other Income",
        name: "Other Income",
        flow_direction: "in",
        description: "Other business income",
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        type_name: "Customer Credit Payment",
        name: "Customer Credit Payment",
        flow_direction: "in",
        description: "Payment received from customer to pay off credit balance",
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("TransactionTypes", null, {});
  },
};
