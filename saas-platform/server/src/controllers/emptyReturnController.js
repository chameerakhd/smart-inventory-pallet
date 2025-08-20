// controllers / emptyReturnsController.js;
// const {
//   // EmptyReturn,
//   // EmptyReturnsDetail,
//   // Lorry,
//   // Product,
//   sequelize,
// } = require("../models");
const { Op } = require("sequelize");

// Create a new empty return with details
exports.createEmptyReturn = async (req, res) => {
  const db = req.db; // Use the database instance from the request
  const sequelizeInstance = db.EmptyReturn.sequelize;
  const transaction = await sequelizeInstance.transaction();

  try {
    const { return_date, lorry_id, details } = req.body;

    // Validate required fields
    if (
      !return_date ||
      !lorry_id ||
      !details ||
      !Array.isArray(details) ||
      details.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: return_date, lorry_id, and details array are required",
      });
    }

    // Validate details array format
    for (const detail of details) {
      if (
        !detail.product_id ||
        detail.empty_bottles_returned === undefined ||
        detail.empty_cases_returned === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each detail must include product_id, empty_bottles_returned, and empty_cases_returned",
        });
      }
    }

    // Check if lorry exists
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const EmptyReturn = req.db.EmptyReturn; // Use the EmptyReturn model from the database instance
    const EmptyReturnsDetail = req.db.EmptyReturnsDetail; // Use the EmptyReturnsDetail model from the database instance
    const Product = req.db.Product; // Use the Product model from the database instance
    const lorry = await Lorry.findByPk(lorry_id);
    if (!lorry) {
      return res.status(404).json({
        success: false,
        message: `Lorry with ID ${lorry_id} not found`,
      });
    }

    // Check if all products exist
    const productIds = details.map((detail) => detail.product_id);
    const products = await Product.findAll({
      where: {
        product_id: {
          [Op.in]: productIds,
        },
      },
    });

    if (products.length !== productIds.length) {
      return res.status(404).json({
        success: false,
        message: "One or more product IDs are invalid",
      });
    }

    // Create empty return
    const emptyReturn = await EmptyReturn.create(
      {
        return_date,
        lorry_id,
      },
      { transaction }
    );

    // Create empty return details
    const emptyReturnDetails = await Promise.all(
      details.map((detail) =>
        EmptyReturnsDetail.create(
          {
            empty_return_id: emptyReturn.empty_return_id,
            product_id: detail.product_id,
            empty_bottles_returned: detail.empty_bottles_returned,
            empty_cases_returned: detail.empty_cases_returned,
          },
          { transaction }
        )
      )
    );

    await transaction.commit();

    // Return newly created empty return with details
    const createdEmptyReturn = await EmptyReturn.findByPk(
      emptyReturn.empty_return_id,
      {
        include: [
          {
            model: Lorry,
            as: "lorry",
            attributes: ["lorry_id", "lorry_number"],
          },
          {
            model: EmptyReturnsDetail,
            as: "emptyReturnsDetails",
            include: [
              {
                model: Product,
                as: "product",
                attributes: ["product_id", "product_name", "size"],
              },
            ],
          },
        ],
      }
    );

    // Calculate summary statistics
    const totalEmptyBottles = createdEmptyReturn.emptyReturnsDetails.reduce(
      (sum, detail) => sum + detail.empty_bottles_returned,
      0
    );

    const totalEmptyCases = createdEmptyReturn.emptyReturnsDetails.reduce(
      (sum, detail) => sum + detail.empty_cases_returned,
      0
    );

    res.status(201).json({
      success: true,
      message: "Empty return created successfully",
      summary: {
        totalEmptyBottles,
        totalEmptyCases,
      },
      data: createdEmptyReturn,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating empty return:", error);
    res.status(500).json({
      success: false,
      message: "Error creating empty return",
      error: error.message,
    });
  }
};

// Get empty returns for a specific time period with optional lorry filter
exports.getEmptyReturnsByTimeFrame = async (req, res) => {
  try {
    // Extract query parameters with validation
    const { startDate, endDate, lorryId } = req.query;
    const db = req.db; // Use the database instance from the request

    // Validate required parameters
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Both startDate and endDate are required query parameters",
      });
    }

    // Build query conditions
    const whereConditions = {
      return_date: {
        [Op.between]: [startDate, endDate],
      },
    };

    // Add lorry filter if provided
    if (lorryId) {
      whereConditions.lorry_id = lorryId;
    }

    // Fetch empty returns with details
    const EmptyReturn = req.db.EmptyReturn; // Use the EmptyReturn model from the database instance
    const EmptyReturnsDetail = req.db.EmptyReturnsDetail; // Use the EmptyReturnsDetail model from the database instance
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const Product = req.db.Product; // Use the Product model from the database instance

    const emptyReturns = await EmptyReturn.findAll({
      where: whereConditions,
      include: [
        {
          model: Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
        {
          model: EmptyReturnsDetail,
          as: "emptyReturnsDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["product_id", "product_name", "size"],
            },
          ],
        },
      ],
      order: [["return_date", "DESC"]],
    });

    // Calculate summary statistics
    const totalEmptyBottles = emptyReturns.reduce((sum, emptyReturn) => {
      return (
        sum +
        emptyReturn.emptyReturnsDetails.reduce((detailSum, detail) => {
          return detailSum + detail.empty_bottles_returned;
        }, 0)
      );
    }, 0);

    const totalEmptyCases = emptyReturns.reduce((sum, emptyReturn) => {
      return (
        sum +
        emptyReturn.emptyReturnsDetails.reduce((detailSum, detail) => {
          return detailSum + detail.empty_cases_returned;
        }, 0)
      );
    }, 0);

    // Return formatted response
    res.status(200).json({
      success: true,
      count: emptyReturns.length,
      summary: {
        totalEmptyBottles,
        totalEmptyCases,
      },
      data: emptyReturns,
    });
  } catch (error) {
    console.error("Error fetching empty returns:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching empty returns",
      error: error.message,
    });
  }
};

// Get details for a specific empty return
exports.getEmptyReturnById = async (req, res) => {
  try {
    const { id } = req.params;

    const EmptyReturn = req.db.EmptyReturn; // Use the EmptyReturn model from the database instance
    const EmptyReturnsDetail = req.db.EmptyReturnsDetail; // Use the EmptyReturnsDetail model from the database instance
    const Lorry = req.db.Lorry; // Use the Lorry model from the database instance
    const Product = req.db.Product; // Use the Product model from the database instance
    const emptyReturn = await EmptyReturn.findByPk(id, {
      include: [
        {
          model: Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
        {
          model: EmptyReturnsDetail,
          as: "emptyReturnsDetails",
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["product_id", "product_name", "size"],
            },
          ],
        },
      ],
    });

    if (!emptyReturn) {
      return res.status(404).json({
        success: false,
        message: `Empty return with ID ${id} not found`,
      });
    }

    res.status(200).json({
      success: true,
      data: emptyReturn,
    });
  } catch (error) {
    console.error("Error fetching empty return details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching empty return details",
      error: error.message,
    });
  }
};
