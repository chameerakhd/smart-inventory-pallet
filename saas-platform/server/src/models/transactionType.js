"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class TransactionType extends Model {
    static associate(models) {
      TransactionType.hasMany(models.Transaction, {
        foreignKey: "transaction_type_id",
        as: "transactions",
      });
    }
  }

  TransactionType.init(
    {
      type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      type_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      flow_direction: {
        type: DataTypes.ENUM("in", "out", "transfer"),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "TransactionType",
      tableName: "TransactionTypes",
      timestamps: true,
      underscored: true,
    }
  );

  return TransactionType;
};
