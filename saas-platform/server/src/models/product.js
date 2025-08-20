"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      // Product has many LoadingDetails
      Product.hasMany(models.LoadingDetail, {
        foreignKey: "product_id",
        as: "loadingDetails",
      });

      // Product has many UnloadingDetails
      Product.hasMany(models.UnloadingDetail, {
        foreignKey: "product_id",
        as: "unloadingDetails",
      });

      // Product has many DailySales
      Product.hasMany(models.DailySalesDetails, {
        foreignKey: "product_id",
        as: "dailySalesDetails",
      });

      // Product has one StockInventory
      Product.hasOne(models.StockInventory, {
        foreignKey: "product_id",
        as: "inventory",
      });
    }
  }

  Product.init(
    {
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      product_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      unit_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      selling_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      bottles_per_case: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      size: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Product",
      tableName: "Products",
      timestamps: true,
      underscored: true,
    }
  );

  return Product;
};
