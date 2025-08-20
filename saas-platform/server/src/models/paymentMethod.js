"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class PaymentMethod extends Model {
    static associate(models) {
      PaymentMethod.hasMany(models.Transaction, {
        foreignKey: "payment_method_id",
        as: "transactions",
      });
    }
  }

  PaymentMethod.init(
    {
      method_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          isIn: [["cash", "check", "credit", "bank transfer"]],
        },
      },
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PaymentMethod",
      tableName: "PaymentMethods",
      timestamps: true,
      underscored: true,
    }
  );

  return PaymentMethod;
};
