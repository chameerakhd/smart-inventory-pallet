"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class SubDiscountType extends Model {
    static associate(models) {
      // SubDiscountType belongs to DiscountType
      SubDiscountType.belongsTo(models.DiscountType, {
        foreignKey: "discount_type_id",
        as: "discountType",
      });

      // SubDiscountType has many ShopDiscountValues
      SubDiscountType.hasMany(models.ShopDiscountValue, {
        foreignKey: "sub_discount_type_id",
        as: "shopDiscountValues",
      });

      // SubDiscountType has many Discounts
      SubDiscountType.hasMany(models.Discount, {
        foreignKey: "sub_discount_type_id",
        as: "discounts",
      });
    }
  }

  SubDiscountType.init(
    {
      sub_discount_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      discount_type_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "DiscountTypes",
          key: "discount_type_id",
        },
      },
      sub_discount_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "SubDiscountType",
      tableName: "SubDiscountTypes",
      timestamps: true,
      underscored: true,
    }
  );

  return SubDiscountType;
};
