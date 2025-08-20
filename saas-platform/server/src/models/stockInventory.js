"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class StockInventory extends Model {
    static associate(models) {
      // StockInventory belongs to one Product
      StockInventory.belongsTo(models.Product, {
        foreignKey: "product_id",
        as: "product",
      });
    }

    // Instance method to correct bottles and cases
    async correctBottlesAndCases() {
      // Get the product to access bottles_per_case
      const product = await this.getProduct();

      if (!product) {
        throw new Error("Product not found for this inventory item");
      }

      const bottlesPerCase = product.bottles_per_case;

      // Calculate total bottles first
      const totalBottles = this.cases_qty * bottlesPerCase + this.bottles_qty;

      // Convert to proper cases and bottles format
      this.cases_qty = Math.floor(totalBottles / bottlesPerCase);
      this.bottles_qty = totalBottles % bottlesPerCase;

      // Recalculate total_bottles
      this.total_bottles = this.cases_qty * bottlesPerCase + this.bottles_qty;

      // Update last_updated
      this.last_updated = new Date();

      return this;
    }

    // Static method for bulk correction
    static async correctAllInventory() {
      const inventories = await StockInventory.findAll({
        include: [
          {
            model: sequelize.models.Product,
            as: "product",
          },
        ],
      });

      const results = [];

      for (const inventory of inventories) {
        const product = inventory.product;
        const bottlesPerCase = product.bottles_per_case;

        if (inventory.bottles_qty >= bottlesPerCase) {
          // Calculate total bottles first
          const totalBottles =
            inventory.cases_qty * bottlesPerCase + inventory.bottles_qty;

          // Convert to proper format
          inventory.cases_qty = Math.floor(totalBottles / bottlesPerCase);
          inventory.bottles_qty = totalBottles % bottlesPerCase;
          inventory.total_bottles = totalBottles;
          inventory.last_updated = new Date();

          await inventory.save();

          results.push({
            inventory_id: inventory.inventory_id,
            product_name: product.product_name,
            new_cases_qty: inventory.cases_qty,
            new_bottles_qty: inventory.bottles_qty,
            new_total_bottles: inventory.total_bottles,
          });
        }
      }

      return results;
    }
  }

  StockInventory.init(
    {
      inventory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Products",
          key: "product_id",
        },
      },
      cases_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      bottles_qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_bottles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_value: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "StockInventory",
      tableName: "StockInventory",
      timestamps: true,
      underscored: true,
      hooks: {
        // REPLACE THIS ENTIRE HOOK SECTION WITH THE IMPROVED VERSION
        beforeSave: async (instance, options) => {
          // Get the product - handle transaction context properly
          let product;

          if (instance.product) {
            // If product is already loaded (e.g., through include)
            product = instance.product;
          } else {
            // Load the product with transaction context if available
            product = await sequelize.models.Product.findByPk(
              instance.product_id,
              {
                transaction: options.transaction,
              }
            );
          }

          if (product) {
            const bottlesPerCase = product.bottles_per_case;

            // Calculate total bottles first
            const totalBottles =
              instance.cases_qty * bottlesPerCase + instance.bottles_qty;

            // Convert to proper cases and bottles format
            instance.cases_qty = Math.floor(totalBottles / bottlesPerCase);
            instance.bottles_qty = totalBottles % bottlesPerCase;

            // Always recalculate total_bottles
            instance.total_bottles = totalBottles;
          }

          // Update last_updated
          instance.last_updated = new Date();
        },
      },
    }
  );

  return StockInventory;
};
