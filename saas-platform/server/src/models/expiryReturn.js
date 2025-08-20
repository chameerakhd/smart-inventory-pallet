"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ExpiryReturn extends Model {
    static associate(models) {
      // DailySales belongs to one Lorry
      ExpiryReturn.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // UnloadingTransaction has many UnloadingDetails
      // This association in ExpiryReturn model should be:
      ExpiryReturn.hasMany(models.ExpiryReturnsDetail, {
        foreignKey: "expiry_return_id", // Not expiry_return_detail_id
        as: "expiryReturnsDetails",
      });
    }
  }

  ExpiryReturn.init(
    {
      expiry_return_id: {
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
      modelName: "ExpiryReturn",
      tableName: "ExpiryReturns",
      timestamps: true,
      underscored: true,
    }
  );

  return ExpiryReturn;
};
