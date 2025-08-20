"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class EmptyReturnsDetail extends Model {
    static associate(models) {
      // EmptyReturnsDetail belongs to one EmptyReturn
      EmptyReturnsDetail.belongsTo(models.EmptyReturn, {
        foreignKey: "empty_return_id",
        as: "emptyReturn",
        onDelete: "CASCADE",
      });

      // EmptyReturnsDetail belongs to one Product
      EmptyReturnsDetail.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }
  }

  EmptyReturnsDetail.init(
    {
      empty_return_detail_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      empty_return_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "EmptyReturns",
          key: "empty_return_id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },
      empty_bottles_returned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      empty_cases_returned: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "EmptyReturnsDetail",
      tableName: "EmptyReturnsDetails",
      timestamps: true,
      underscored: true,
    }
  );

  return EmptyReturnsDetail;
};
