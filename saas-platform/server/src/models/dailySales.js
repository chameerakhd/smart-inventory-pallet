"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class DailySales extends Model {
    static associate(models) {
      // DailySales belongs to one Lorry
      DailySales.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // DailySales has many DailySalesDetails
      DailySales.hasMany(models.DailySalesDetails, {
        foreignKey: "sales_id",
        as: "salesDetails",
      });
    }
  }

  DailySales.init(
    {
      sales_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      sales_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      lorry_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Lorries",
          key: "lorry_id",
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
      modelName: "DailySales",
      tableName: "DailySales",
      timestamps: true,
      underscored: true,
    }
  );

  return DailySales;
};
