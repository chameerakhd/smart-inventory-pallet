"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UnloadingDetail extends Model {
    static associate(models) {
      // UnloadingDetail belongs to one UnloadingTransaction
      UnloadingDetail.belongsTo(models.UnloadingTransaction, {
        foreignKey: "unloading_id",
        as: "unloadingTransaction",
      });

      // UnloadingDetail belongs to one Product
      UnloadingDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  UnloadingDetail.init(
    {
      unloading_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      unloading_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "UnloadingTransactions",
          key: "unloading_id",
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
      cases_returned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bottles_returned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_bottles_returned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "UnloadingDetail",
      tableName: "UnloadingDetails",
      timestamps: true,
      underscored: true,
    }
  );

  return UnloadingDetail;
};
