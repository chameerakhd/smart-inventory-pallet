"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class LoadingTransaction extends Model {
    static associate(models) {
      // LoadingTransaction belongs to one Lorry
      LoadingTransaction.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // LoadingTransaction has many LoadingDetails
      LoadingTransaction.hasMany(models.LoadingDetail, {
        foreignKey: "loading_id",
        as: "loadingDetails",
      });
    }
  }

  LoadingTransaction.init(
    {
      loading_id: {
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
      loading_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      loading_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      loaded_by: {
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
      modelName: "LoadingTransaction",
      tableName: "LoadingTransactions",
      timestamps: true,
      underscored: true,
    }
  );

  return LoadingTransaction;
};
