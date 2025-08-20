// const db = require("../models");
// const DailySales = db.DailySales;
const { Op } = require("sequelize");
// const DailySalesDetails = db.DailySalesDetails;

exports.getAllDailySales = async (req, res) => {
  try {
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const dailySales = await DailySales.findAll();
    res.status(200).json(dailySales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailySalesById = async (req, res) => {
  try {
    const { id } = req.params;
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const dailySales = await DailySales.findOne({
      where: { sales_id: id },
    });
    if (dailySales) {
      res.status(200).json(dailySales);
    } else {
      res
        .status(404)
        .json({ message: `Daily sales record with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createDailySales = async (req, res) => {
  try {
    const { sales_date, lorry_id, units_sold, sales_income, gross_profit } =
      req.body;

    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const newDailySales = await DailySales.create({
      sales_date: sales_date || new Date(),
      lorry_id,
      units_sold,
      sales_income,
      gross_profit,
    });

    res.status(201).json(newDailySales);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create daily sales record",
    });
  }
};

exports.updateDailySales = async (req, res) => {
  try {
    const { id } = req.params;
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const [updated] = await DailySales.update(req.body, {
      where: { sales_id: id },
    });
    if (updated) {
      const updatedDailySales = await DailySales.findOne({
        where: { sales_id: id },
      });
      return res.status(200).json(updatedDailySales);
    }
    throw new Error("Daily sales record not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteDailySales = async (req, res) => {
  try {
    const { id } = req.params;
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const deleted = await DailySales.destroy({
      where: { sales_id: id },
    });
    if (deleted) {
      return res.status(204).send("Daily sales record deleted");
    }
    throw new Error("Daily sales record not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getDailySalesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.params;
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const dailySales = await DailySales.findAll({
      where: {
        sales_date: {
          [Op.between]: [new Date(startDate), new Date(endDate)],
        },
      },
    });
    res.status(200).json(dailySales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailySalesByLorryId = async (req, res) => {
  try {
    const { lorryId } = req.params;
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const dailySales = await DailySales.findAll({
      where: { lorry_id: lorryId },
    });
    res.status(200).json(dailySales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDailySalesByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const DailySalesDetails = req.db.DailySalesDetails; // Use the DailySalesDetails model from the database instance
    const dailySales = await DailySalesDetails.findAll({
      where: { product_id: productId },
    });
    res.status(200).json(dailySales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get daily sales for the summary overview report
exports.getDailySales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if dates are provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.sales_date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      dateFilter.sales_date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      dateFilter.sales_date = {
        [Op.lte]: endDate,
      };
    }

    const DailySalesDetails = req.db.DailySalesDetails; // Use the DailySalesDetails model from the database instance
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance

    // Get sales details with product information
    const salesDetails = await DailySalesDetails.findAll({
      include: [
        {
          model: DailySales,
          as: "dailySales",
          where: dateFilter,
          include: [
            {
              model: req.db.Lorry,
              as: "lorry",
              attributes: ["lorry_id", "lorry_number"],
            },
          ],
        },
        {
          model: req.db.Product,
          as: "product",
          attributes: [
            "product_id",
            "product_name",
            "size",
            "bottles_per_case",
            "unit_price",
            "selling_price",
          ],
        },
      ],
    });

    // Calculate total gross profit for the period
    const totalGrossProfit = await DailySales.sum("gross_profit", {
      where: dateFilter,
    });

    // Transform data to match the format needed in the SummeryOverview component
    const transformedData = salesDetails.map((detail) => ({
      product_id: detail.product_id,
      lorry_id: detail.dailySales.lorry_id,
      lorry_number: detail.dailySales.lorry.lorry_number,
      sales_date: detail.dailySales.sales_date,
      units_sold: detail.units_sold,
      sales_income: detail.sales_income,
      gross_profit: detail.gross_profit,
      // Include product details for convenience
      product_name: detail.product.product_name,
      size: detail.product.size,
      bottles_per_case: detail.product.bottles_per_case,
      unit_price: detail.product.unit_price,
      selling_price: detail.product.selling_price,
    }));

    res.status(200).json({
      salesData: transformedData,
      totalGrossProfit: totalGrossProfit || 0,
    });
  } catch (error) {
    console.error("Error fetching daily sales:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch daily sales", error: error.message });
  }
};

// Get consolidated daily sales (summed by product)
exports.getConsolidatedDailySales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter if dates are provided
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.sales_date = {
        [Op.between]: [startDate, endDate],
      };
    } else if (startDate) {
      dateFilter.sales_date = {
        [Op.gte]: startDate,
      };
    } else if (endDate) {
      dateFilter.sales_date = {
        [Op.lte]: endDate,
      };
    }

    const DailySalesDetails = req.db.DailySalesDetails; // Use the DailySalesDetails model from the database instance
    const DailySales = req.db.DailySales; // Use the DailySales model from the database instance
    const Product = req.db.Product; // Use the Product model from the database instance
    // Get all sales details within the period
    const salesDetails = await DailySalesDetails.findAll({
      include: [
        {
          model: DailySales,
          as: "dailySales",
          where: dateFilter,
          attributes: ["sales_date"],
        },
      ],
      attributes: [
        "product_id",
        [sequelize.fn("SUM", sequelize.col("units_sold")), "units_sold"],
        [sequelize.fn("SUM", sequelize.col("sales_income")), "sales_income"],
        [sequelize.fn("SUM", sequelize.col("gross_profit")), "gross_profit"],
      ],
      group: ["product_id"],
      include: [
        {
          model: Product,
          as: "product",
          attributes: ["product_name", "size", "bottles_per_case"],
        },
      ],
    });

    const consolidatedData = salesDetails.map((detail) => ({
      product_id: detail.product_id,
      product_name: detail.product.product_name,
      size: detail.product.size,
      bottles_per_case: detail.product.bottles_per_case,
      units_sold: parseInt(detail.dataValues.units_sold, 10),
      sales_income: parseFloat(detail.dataValues.sales_income),
      gross_profit: parseFloat(detail.dataValues.gross_profit),
    }));

    res.status(200).json(consolidatedData);
  } catch (error) {
    console.error("Error fetching consolidated daily sales:", error);
    res.status(500).json({
      message: "Failed to fetch consolidated daily sales",
      error: error.message,
    });
  }
};
