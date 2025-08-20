"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TransactionDetail extends Model {
    static associate(models) {
      TransactionDetail.belongsTo(models.Transaction, {
        foreignKey: "transaction_id",
        as: "transaction",
      });

      // Polymorphic associations
      TransactionDetail.belongsTo(models.SalesInvoice, {
        foreignKey: "entity_id",
        constraints: false,
        as: "salesInvoice",
        scope: {
          entity_type: "sales_invoice",
        },
      });

      TransactionDetail.belongsTo(models.PurchaseInvoice, {
        foreignKey: "entity_id",
        constraints: false,
        as: "purchaseInvoice",
        scope: {
          entity_type: "purchase_invoice",
        },
      });
    }
  }

  TransactionDetail.init(
    {
      detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Transactions",
          key: "transaction_id",
        },
      },
      entity_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [["sales_invoice", "purchase_invoice"]],
        },
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      notes: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TransactionDetail",
      tableName: "TransactionDetails",
      timestamps: true,
      underscored: true,
      hooks: {
        afterCreate: async (detail, options) => {
          try {
            const models = sequelize.models;
            const transaction = await models.Transaction.findByPk(
              detail.transaction_id,
              {
                include: ["transactionType"],
                transaction: options.transaction,
              }
            );

            if (!transaction) {
              throw new Error("Transaction not found");
            }

            // Update entity based on entity_type
            // if (detail.entity_type === "sales_invoice") {
            //   const invoice = await models.SalesInvoice.findByPk(
            //     detail.entity_id,
            //     { transaction: options.transaction }
            //   );
            //   if (!invoice) {
            //     throw new Error("Sales invoice not found");
            //   }

            //   // If this is a payment transaction (transaction_type_id = 1 is Customer Payment)
            //   if (transaction.transaction_type_id === 1) {
            //     // Update invoice paid amount and amount due
            //     invoice.paid_amount += detail.amount;
            //     invoice.amount_due = Math.max(
            //       0,
            //       invoice.total_amount - invoice.paid_amount
            //     );

            //     // Update status
            //     if (invoice.paid_amount >= invoice.total_amount) {
            //       invoice.status = "paid";
            //     } else if (invoice.paid_amount > 0) {
            //       invoice.status = "partially paid";
            //     }

            //     await invoice.save({ transaction: options.transaction });

            //     // Update customer outstanding balance with payment
            //     const customer = await models.Customer.findByPk(
            //       invoice.customer_id,
            //       { transaction: options.transaction }
            //     );
            //     if (customer) {
            //       customer.outstanding_balance = Math.max(
            //         0,
            //         customer.outstanding_balance - detail.amount
            //       );
            //       await customer.save({ transaction: options.transaction });
            //     }
            //   }
            // } else if (detail.entity_type === "purchase_invoice") {
            //   const purchase = await models.PurchaseInvoice.findByPk(
            //     detail.entity_id,
            //     { transaction: options.transaction }
            //   );
            //   if (!purchase) {
            //     throw new Error("Purchase invoice not found");
            //   }

            //   // If this is a payment transaction (transaction_type_id = 3 is Supplier Payment)
            //   if (transaction.transaction_type_id === 3) {
            //     // Update purchase paid amount and amount due
            //     purchase.paid_amount += detail.amount;
            //     purchase.amount_due = Math.max(
            //       0,
            //       purchase.total_amount - purchase.paid_amount
            //     );

            //     // Update status
            //     if (purchase.paid_amount >= purchase.total_amount) {
            //       purchase.status = "paid";
            //     } else if (purchase.paid_amount > 0) {
            //       purchase.status = "partially paid";
            //     }

            //     await purchase.save({ transaction: options.transaction });

            //     // Update supplier outstanding balance with payment
            //     const supplier = await models.Supplier.findByPk(
            //       purchase.supplier_id,
            //       { transaction: options.transaction }
            //     );
            //     if (supplier) {
            //       supplier.outstanding_balance = Math.max(
            //         0,
            //         supplier.outstanding_balance - detail.amount
            //       );
            //       await supplier.save({ transaction: options.transaction });
            //     }
            //   }
            // }
          } catch (error) {
            throw error;
          }
        },
      },
    }
  );

  return TransactionDetail;
};
