"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.TransactionType, {
        foreignKey: "transaction_type_id",
        as: "transactionType",
      });

      Transaction.belongsTo(models.PaymentMethod, {
        foreignKey: "payment_method_id",
        as: "paymentMethod",
      });

      Transaction.belongsTo(models.BankAccount, {
        foreignKey: "bank_account_id",
        as: "bankAccount",
      });

      Transaction.belongsTo(models.CashDrawer, {
        foreignKey: "cash_drawer_id",
        as: "cashDrawer",
      });

      Transaction.hasMany(models.TransactionDetail, {
        foreignKey: "transaction_id",
        as: "transactionDetails",
      });
    }
  }

  Transaction.init(
    {
      transaction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      reference_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      transaction_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      transaction_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      transaction_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "TransactionTypes",
          key: "type_id",
        },
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      payment_method_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "PaymentMethods",
          key: "method_id",
        },
      },
      bank_account_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "BankAccounts",
          key: "account_id",
        },
      },
      cash_drawer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "CashDrawers",
          key: "drawer_id",
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "completed",
      },
      reference_document: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Transaction",
      tableName: "Transactions",
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (transaction, options) => {
          // Update balances based on transaction type and payment method
          try {
            const models = sequelize.models;
            const transactionType = await models.TransactionType.findByPk(
              transaction.transaction_type_id
            );

            if (!transactionType) {
              throw new Error("Transaction type not found");
            }

            // Update bank account or cash drawer balance
            if (transaction.bank_account_id) {
              const bankAccount = await models.BankAccount.findByPk(
                transaction.bank_account_id,
                { transaction: options.transaction }
              );
              if (!bankAccount) {
                throw new Error("Bank account not found");
              }

              if (transactionType.flow_direction === "in") {
                bankAccount.current_balance += transaction.amount;
              } else if (transactionType.flow_direction === "out") {
                bankAccount.current_balance -= transaction.amount;
              }

              await bankAccount.save({ transaction: options.transaction });
            } else if (transaction.cash_drawer_id) {
              const cashDrawer = await models.CashDrawer.findByPk(
                transaction.cash_drawer_id,
                { transaction: options.transaction }
              );
              if (!cashDrawer) {
                throw new Error("Cash drawer not found");
              }

              if (transactionType.flow_direction === "in") {
                cashDrawer.current_balance += transaction.amount;
              } else if (transactionType.flow_direction === "out") {
                cashDrawer.current_balance -= transaction.amount;
              }

              await cashDrawer.save({ transaction: options.transaction });
            }
          } catch (error) {
            throw error;
          }
        },
      },
    }
  );

  return Transaction;
};
