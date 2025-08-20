"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class CashDrawer extends Model {
    static associate(models) {
      CashDrawer.hasMany(models.Transaction, {
        foreignKey: "cash_drawer_id",
        as: "transactions",
      });
    }
  }

  CashDrawer.init(
    {
      drawer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      current_balance: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.ENUM("open", "closed"),
        allowNull: false,
        defaultValue: "closed",
      },
      last_counted: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "CashDrawer",
      tableName: "CashDrawers",
      timestamps: true,
      underscored: true,
    }
  );

  return CashDrawer;
};
