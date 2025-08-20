"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DailySalesDetails extends Model {
    static associate(models) {
      // DailySalesDetail belongs to one DailySales
      DailySalesDetails.belongsTo(models.DailySales, {
        foreignKey: "sales_id",
        as: "dailySales",
      });

      // DailySalesDetail belongs to one Product
      DailySalesDetails.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  DailySalesDetails.init(
    {
      sales_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      sales_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "DailySales",
          key: "sales_id",
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
      units_sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      sales_income: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      gross_profit: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "DailySalesDetails",
      tableName: "DailySalesDetails",
      timestamps: true,
      underscored: true,
    }
  );

  return DailySalesDetails;
};
