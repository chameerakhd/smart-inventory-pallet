"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class UnloadingTransaction extends Model {
    static associate(models) {
      // UnloadingTransaction belongs to one Lorry
      UnloadingTransaction.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // UnloadingTransaction has many UnloadingDetails
      UnloadingTransaction.hasMany(models.UnloadingDetail, {
        foreignKey: "unloading_id",
        as: "unloadingDetails",
      });
    }
  }

  UnloadingTransaction.init(
    {
      unloading_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      lorry_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Lorries",
          key: "lorry_id",
        },
      },
      unloading_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      unloading_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      unloaded_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
    },
    {
      sequelize,
      modelName: "UnloadingTransaction",
      tableName: "UnloadingTransactions",
      timestamps: true,
      underscored: true,
    }
  );

  return UnloadingTransaction;
};
