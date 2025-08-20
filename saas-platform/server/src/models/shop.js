"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Shop extends Model {
    static associate(models) {
      // Shop has many ShopDiscountValues
      Shop.hasMany(models.ShopDiscountValue, {
        foreignKey: "shop_id",
        as: "shopDiscountValues",
      });

      // Shop has many Discounts
      Shop.hasMany(models.Discount, {
        foreignKey: "shop_id",
        as: "discounts",
      });

      // Shop belongs to DiscountType
      Shop.belongsTo(models.DiscountType, {
        foreignKey: "discount_type_id",
        as: "discountType",
      });
    }
  }

  Shop.init(
    {
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      shop_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      max_discounted_cases: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      discount_type_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Shop",
      tableName: "Shops",
      timestamps: true,
      underscored: true,
    }
  );

  return Shop;
};
