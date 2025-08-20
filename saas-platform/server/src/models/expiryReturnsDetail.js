"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ExpiryReturnsDetail extends Model {
    static associate(models) {
      // UnloadingDetail belongs to one UnloadingTransaction
      ExpiryReturnsDetail.belongsTo(models.ExpiryReturn, {
        foreignKey: "expiry_return_id",
        as: "expiryReturn",
      });

      // UnloadingDetail belongs to one Product
      ExpiryReturnsDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  ExpiryReturnsDetail.init(
    {
      expiry_return_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      expiry_return_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "ExpiryReturns",
          key: "expiry_return_id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },
      bottles_expired: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      expiry_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ExpiryReturnsDetail",
      tableName: "ExpiryReturnsDetails",
      timestamps: true,
      underscored: true,
    }
  );

  return ExpiryReturnsDetail;
};
