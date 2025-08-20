"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EmptyReturn extends Model {
    static associate(models) {
      // DailySales belongs to one Lorry
      EmptyReturn.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // UnloadingTransaction has many UnloadingDetails
      EmptyReturn.hasMany(models.EmptyReturnsDetail, {
        foreignKey: "empty_return_id", // Corrected
        as: "emptyReturnsDetails",
      });
    }
  }

  EmptyReturn.init(
    {
      empty_return_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      return_date: {
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
    },
    {
      sequelize,
      modelName: "EmptyReturn",
      tableName: "EmptyReturns",
      timestamps: true,
      underscored: true,
    }
  );

  return EmptyReturn;
};
