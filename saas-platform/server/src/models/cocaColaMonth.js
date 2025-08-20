"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CocaColaMonth extends Model {
    static associate(models) {
      // Define associations if needed
    }
  }

  CocaColaMonth.init(
    {
      month_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "CocaColaMonth",
      tableName: "CocaColaMonths",
      timestamps: true,
      underscored: true,
    }
  );

  return CocaColaMonth;
};
