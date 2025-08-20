const { Op } = require("sequelize");
const db = require("../models");
// const Product = db.Product;
// const StockInventory = db.StockInventory;

exports.getAllProducts = async (req, res) => {
  try {
    // Extract filter parameters from query string
    const { size, brand, sortBy } = req.query;
    const db = req.db; // Use the database instance from the request
    const StockInventory = db.StockInventory; // Use the StockInventory model from the database instance
    const Product = db.Product; // Use the Product model from the database instance

    // Build query conditions
    const whereConditions = {};
    if (size) {
      whereConditions.size = size;
    }
    if (brand) {
      // Make brand filtering case-insensitive using LOWER function
      whereConditions.product_name = {
        [Op.iLike]: `%${brand}%`,
      };
    }

    // Build sort options
    let order = [];
    if (sortBy) {
      switch (sortBy) {
        case "Size":
          // We'll handle size sorting separately after query
          break;
        case "Brand":
          order.push(["product_name", "ASC"]);
          break;
        case "Count":
          order.push(["bottles_per_case", "ASC"]);
          break;
        default:
          order.push(["product_id", "ASC"]);
      }
    }

    const products = await Product.findAll({
      where: whereConditions,
      include: [
        {
          model: StockInventory,
          as: "inventory",
          required: false, // Use left join to include products with no inventory
        },
      ],
      order,
    });

    // Transform data for frontend
    let transformedProducts = products.map((product) => {
      const productJson = product.toJSON();
      const inventory = productJson.inventory || {};

      return {
        product_id: productJson.product_id,
        product_name: productJson.product_name,
        size: productJson.size,
        unit_price: productJson.unit_price,
        selling_price: productJson.selling_price,
        bottles_per_case: productJson.bottles_per_case,
        cases_qty: inventory.cases_qty || 0,
        bottles_qty: inventory.bottles_qty || 0,
        total_bottles: inventory.total_bottles || 0,
        total_value: inventory.total_value || 0,
        last_updated: inventory.last_updated,
      };
    });

    // Custom size sorting logic
    if (sortBy === "Size") {
      const sizeOrder = {
        "175 mL": 1,
        "250 mL": 4,
        "300 mL": 2,
        "355 mL": 9,
        "400 mL": 5,
        "500 mL": 10,
        "750 mL": 3,
        "1 L": 11,
        "1050 mL": 6,
        "1.5 L": 7,
        "2 L": 8,
      };

      transformedProducts.sort((a, b) => {
        // Default high value for sizes not in our predefined order
        const aOrder =
          sizeOrder[a.size] !== undefined ? sizeOrder[a.size] : 999;
        const bOrder =
          sizeOrder[b.size] !== undefined ? sizeOrder[b.size] : 999;
        return aOrder - bOrder;
      });
    }

    res.status(200).json(transformedProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: error.message });
  }
};

// Get unique sizes for filtering
exports.getProductSizes = async (req, res) => {
  try {
    const sizeOrder = {
      "175 mL": 1,
      "250 mL": 2,
      "300 mL": 3,
      "355 mL": 4,
      "400 mL": 5,
      "500 mL": 6,
      "750 mL": 7,
      "1 L": 8,
      "1050 mL": 9,
      "1.5 L": 10,
      "2 L": 11,
    };

    const db_req = req.db; // Use the database instance from the request
    const Product = db_req.Product; // Use the Product model from the database instance

    const sizes = await Product.findAll({
      attributes: [
        [db.sequelize.fn("DISTINCT", db.sequelize.col("size")), "size"],
      ],
    });

    // Extract sizes and sort them using the custom order
    const sortedSizes = sizes
      .map((item) => item.size)
      .sort((a, b) => {
        // If both sizes are in the sizeOrder object, sort by their order value
        if (sizeOrder[a] !== undefined && sizeOrder[b] !== undefined) {
          return sizeOrder[a] - sizeOrder[b];
        }
        // If only one size is in the order, prioritize the one that is
        else if (sizeOrder[a] !== undefined) {
          return -1;
        } else if (sizeOrder[b] !== undefined) {
          return 1;
        }
        // If neither size is in the order, maintain alphabetical sorting
        else {
          return a.localeCompare(b);
        }
      });

    res.status(200).json(sortedSizes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get unique brands for filtering
exports.getProductBrands = async (req, res) => {
  try {
    const db_req = req.db; // Use the database instance from the request
    const Product = db_req.Product; // Use the Product model from the database instance
    const brands = await Product.findAll({
      attributes: [
        [
          db.sequelize.fn("DISTINCT", db.sequelize.col("product_name")),
          "product_name",
        ],
      ],
      order: [["product_name", "ASC"]],
    });

    res.status(200).json(brands.map((item) => item.product_name));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const Product = db.Product; // Use the Product model from the database instance
    const product = await Product.findOne({
      where: { product_id: id },
    });
    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: `Product with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const {
      product_name,
      unit_price,
      selling_price,
      bottles_per_case,
      size,
      active,
    } = req.body;

    const db = req.db; // Use the database instance from the request
    const Product = db.Product; // Use the Product model from the database instance

    const newProduct = await Product.create({
      product_name,
      unit_price,
      selling_price,
      bottles_per_case,
      size,
      active: active !== undefined ? active : true,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create product",
    });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("product_id", id);
    const { product_name, size, unit_price, selling_price, bottles_per_case } =
      req.body;

    const db = req.db; // Use the database instance from the request
    const Product = db.Product; // Use the Product model from the database instance

    // Find the product by ID
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    // Update product fields
    await product.update({
      product_name,
      size,
      unit_price,
      selling_price,
      bottles_per_case,
    });

    res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      error: error.message,
      message: "Failed to update product",
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.db; // Use the database instance from the request
    const Product = db.Product; // Use the Product model from the database instance
    const deleted = await Product.destroy({
      where: { product_id: id },
    });
    if (deleted) {
      return res.status(204).send("Product deleted");
    }
    throw new Error("Product not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
