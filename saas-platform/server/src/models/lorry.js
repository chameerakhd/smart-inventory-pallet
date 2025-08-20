"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Lorry extends Model {
    static associate(models) {
      // Lorry has many LoadingTransactions
      Lorry.hasMany(models.LoadingTransaction, {
        foreignKey: "lorry_id",
        as: "loadingTransactions",
      });

      // Lorry has many UnloadingTransactions
      Lorry.hasMany(models.UnloadingTransaction, {
        foreignKey: "lorry_id",
        as: "unloadingTransactions",
      });

      // Lorry has many DailySales
      Lorry.hasMany(models.DailySales, {
        foreignKey: "lorry_id",
        as: "dailySales",
      });
    }
  }

  Lorry.init(
    {
      lorry_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      lorry_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      driver_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contact_number: {
        type: DataTypes.STRING,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: "Lorry",
      tableName: "Lorries",
      timestamps: true,
      underscored: true,
    }
  );

  return Lorry;
};
