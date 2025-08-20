"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Discount extends Model {
    static associate(models) {
      // Discount belongs to Shop
      Discount.belongsTo(models.Shop, {
        foreignKey: "shop_id",
        as: "shop",
      });

      // Discount belongs to Lorry
      Discount.belongsTo(models.Lorry, {
        foreignKey: "lorry_id",
        as: "lorry",
      });

      // Discount belongs to SubDiscountType
      Discount.belongsTo(models.SubDiscountType, {
        foreignKey: "sub_discount_type_id",
        as: "subDiscountType",
      });
    }
  }

  Discount.init(
    {
      discount_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Shops",
          key: "shop_id",
        },
      },
      selling_date: {
        type: DataTypes.DATE,
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
      sub_discount_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "SubDiscountTypes",
          key: "sub_discount_type_id",
        },
      },
      discounted_cases: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      invoice_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      total_discount: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Discount",
      tableName: "Discounts",
      timestamps: true,
      underscored: true,
    }
  );

  return Discount;
};
