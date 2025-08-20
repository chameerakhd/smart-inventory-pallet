"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SalesInvoice extends Model {
    static associate(models) {
      SalesInvoice.belongsTo(models.Customer, {
        foreignKey: "customer_id",
        as: "customer",
      });

      // Add association to Lorry if it exists
      if (models.Lorry) {
        SalesInvoice.belongsTo(models.Lorry, {
          foreignKey: "lorry_id",
          as: "lorry",
        });
      }

      SalesInvoice.hasMany(models.TransactionDetail, {
        foreignKey: "entity_id",
        constraints: false,
        scope: {
          entity_type: "sales_invoice",
        },
        as: "transactionDetails",
      });
    }
  }

  SalesInvoice.init(
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
      customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Customers",
          key: "customer_id",
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
      // Use lorry_id instead of vehicle_id to match the Lorry model
      lorry_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "Lorries",
          key: "lorry_id",
        },
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "SalesInvoice",
      tableName: "SalesInvoices",
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (invoice) => {
          // Calculate balance before creating
          // Cap the paid_amount to the total_amount to avoid negative balance
          if (invoice.paid_amount > invoice.total_amount) {
            invoice.paid_amount = invoice.total_amount;
          }

          invoice.balance = Math.max(
            0,
            invoice.total_amount - invoice.paid_amount
          );

          // Set status based on balance and due date
          if (invoice.balance <= 0) {
            invoice.status = "paid";
          } else if (invoice.paid_amount > 0) {
            invoice.status = "partially paid";
          } else if (invoice.due_date < new Date()) {
            invoice.status = "overdue";
          }
        },
        beforeUpdate: async (invoice) => {
          // Recalculate balance if total_amount or paid_amount changed
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

          // Update status based on balance and due date
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

  return SalesInvoice;
};
