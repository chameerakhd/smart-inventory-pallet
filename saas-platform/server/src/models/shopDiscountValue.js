"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class ShopDiscountValue extends Model {
    static associate(models) {
      // ShopDiscountValue belongs to Shop
      ShopDiscountValue.belongsTo(models.Shop, {
        foreignKey: "shop_id",
        as: "shop",
      });

      // ShopDiscountValue belongs to SubDiscountType
      ShopDiscountValue.belongsTo(models.SubDiscountType, {
        foreignKey: "sub_discount_type_id",
        as: "subDiscountType",
      });
    }
  }

  ShopDiscountValue.init(
    {
      shop_discount_id: {
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
      sub_discount_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "SubDiscountTypes",
          key: "sub_discount_type_id",
        },
      },
      discount_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "ShopDiscountValue",
      tableName: "ShopDiscountValues",
      timestamps: true,
      underscored: true,
    }
  );

  return ShopDiscountValue;
};
