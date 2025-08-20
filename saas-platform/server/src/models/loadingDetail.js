"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LoadingDetail extends Model {
    static associate(models) {
      // LoadingDetail belongs to one LoadingTransaction
      LoadingDetail.belongsTo(models.LoadingTransaction, {
        foreignKey: "loading_id",
        as: "loadingTransaction",
      });

      // LoadingDetail belongs to one Product
      LoadingDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  LoadingDetail.init(
    {
      loading_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      loading_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "LoadingTransactions",
          key: "loading_id",
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
      cases_loaded: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      bottles_loaded: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      total_bottles_loaded: {
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
      modelName: "LoadingDetail",
      tableName: "LoadingDetails",
      timestamps: true,
      underscored: true,
    }
  );

  return LoadingDetail;
};
