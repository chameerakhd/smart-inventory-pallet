"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PurchaseInvoice extends Model {
    static associate(models) {
      PurchaseInvoice.belongsTo(models.Supplier, {
        foreignKey: "supplier_id",
        as: "supplier",
      });

      PurchaseInvoice.hasMany(models.TransactionDetail, {
        foreignKey: "entity_id",
        constraints: false,
        scope: {
          entity_type: "purchase_invoice",
        },
        as: "transactionDetails",
      });
    }
  }

  PurchaseInvoice.init(
    {
      invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      invoice_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      supplier_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Suppliers",
          key: "supplier_id",
        },
      },
      invoice_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      due_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      total_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      paid_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "unpaid",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      purchase_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PurchaseInvoice",
      tableName: "PurchaseInvoices",
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (invoice) => {
          // Cap the paid_amount to the total_amount to avoid negative balance
          if (invoice.paid_amount > invoice.total_amount) {
            invoice.paid_amount = invoice.total_amount;
          }

          invoice.balance = Math.max(
            0,
            invoice.total_amount - invoice.paid_amount
          );

          if (invoice.balance <= 0) {
            invoice.status = "paid";
          } else if (invoice.paid_amount > 0) {
            invoice.status = "partially paid";
          } else if (invoice.due_date < new Date()) {
            invoice.status = "overdue";
          }
        },
        beforeUpdate: async (invoice) => {
          if (
            invoice.changed("total_amount") ||
            invoice.changed("paid_amount")
          ) {
            // Cap the paid_amount to the total_amount to avoid negative balance
            if (invoice.paid_amount > invoice.total_amount) {
              invoice.paid_amount = invoice.total_amount;
            }

            invoice.balance = Math.max(
              0,
              invoice.total_amount - invoice.paid_amount
            );
          }

          if (invoice.balance <= 0) {
            invoice.status = "paid";
          } else if (invoice.paid_amount > 0) {
            invoice.status = "partially paid";
          } else if (
            invoice.due_date < new Date() &&
            invoice.status !== "cancelled"
          ) {
            invoice.status = "overdue";
          }
        },
      },
    }
  );

  return PurchaseInvoice;
};
