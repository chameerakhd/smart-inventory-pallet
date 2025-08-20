"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class BankAccount extends Model {
    static associate(models) {
      BankAccount.hasMany(models.Transaction, {
        foreignKey: "bank_account_id",
        as: "transactions",
      });
    }
  }

  BankAccount.init(
    {
      account_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      bank_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      account_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      account_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      current_balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      account_type: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          isIn: [["checking", "savings"]],
        },
      },
    },
    {
      sequelize,
      modelName: "BankAccount",
      tableName: "BankAccounts",
      timestamps: true,
      underscored: true,
    }
  );

  return BankAccount;
};
