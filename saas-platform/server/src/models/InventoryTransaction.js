"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class InventoryTransaction extends Model {
    static associate(models) {
      // InventoryTransaction belongs to Product
      InventoryTransaction.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  InventoryTransaction.init(
    {
      transaction_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },
      transaction_type: {
        type: DataTypes.ENUM("ADD", "REMOVE", "ADJUST"),
        allowNull: false,
      },
      cases_qty: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      bottles_qty: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_bottles: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_value: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      notes: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      transaction_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "InventoryTransaction",
      tableName: "InventoryTransactions",
      timestamps: true,
      underscored: true,
    }
  );

  return InventoryTransaction;
};
