// controllers/expiryReturnsController.js
const { Op } = require("sequelize");

exports.createExpiryReturn = async (req, res) => {
  try {
    const { return_date, lorry_id, expiryReturnsDetails } = req.body;
    const { ExpiryReturn, ExpiryReturnsDetail, Lorry, Product } = req.db;

    // Validate required fields
    if (
      !return_date ||
      !lorry_id ||
      !expiryReturnsDetails ||
      !Array.isArray(expiryReturnsDetails)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields. Please provide return_date, lorry_id, and expiryReturnsDetails array",
      });
    }

    // Validate expiryReturnsDetails array
    if (expiryReturnsDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "expiryReturnsDetails array cannot be empty",
      });
    }

    // Check if each detail has the required fields
    for (const detail of expiryReturnsDetails) {
      if (
        !detail.product_id ||
        detail.bottles_expired === undefined ||
        detail.expiry_value === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each expiry return detail must have product_id, bottles_expired, and expiry_value",
        });
      }
    }

    const sequelizeInstance = ExpiryReturn.sequelize;

    // Create transaction to ensure both the header and details are created or none at all
    const result = await sequelizeInstance.transaction(async (t) => {
      // Create the expiry return header
      const expiryReturn = await ExpiryReturn.create(
        {
          return_date,
          lorry_id,
        },
        { transaction: t }
      );

      // Create the expiry return details
      const details = await Promise.all(
        expiryReturnsDetails.map((detail) =>
          ExpiryReturnsDetail.create(
            {
              expiry_return_id: expiryReturn.expiry_return_id,
              product_id: detail.product_id,
              bottles_expired: detail.bottles_expired,
              expiry_value: detail.expiry_value,
            },
            { transaction: t }
          )
        )
      );

      // Return the created data
      return {
        expiryReturn,
        details,
      };
    });

    // Fetch complete data with associations for the response
    const createdExpiryReturn = await ExpiryReturn.findByPk(
      result.expiryReturn.expiry_return_id,
      {
        include: [
          {
            model: Lorry,
            as: "lorry",
            attributes: ["lorry_id", "lorry_number"],
          },
          {
            model: ExpiryReturnsDetail,
            as: "expiryReturnsDetails",
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

    // Calculate totals for summary
    const totalExpiredBottles = createdExpiryReturn.expiryReturnsDetails.reduce(
      (sum, detail) => sum + detail.bottles_expired,
      0
    );

    const totalExpiryValue = createdExpiryReturn.expiryReturnsDetails.reduce(
      (sum, detail) => sum + detail.expiry_value,
      0
    );

    res.status(201).json({
      success: true,
      message: "Expiry return created successfully",
      summary: {
        totalExpiredBottles,
        totalExpiryValue: parseFloat(totalExpiryValue.toFixed(2)),
      },
      data: createdExpiryReturn,
    });
  } catch (error) {
    console.error("Error creating expiry return:", error);
    res.status(500).json({
      success: false,
      message: "Error creating expiry return",
      error: error.message,
    });
  }
};

// Get expiry returns for a specific time period with optional lorry filter
exports.getExpiryReturnsByTimeFrame = async (req, res) => {
  try {
    // Extract query parameters with validation
    const { startDate, endDate, lorryId } = req.query;
    const { ExpiryReturn, ExpiryReturnsDetail, Lorry, Product } = req.db;

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

    // Fetch expiry returns with details
    const expiryReturns = await ExpiryReturn.findAll({
      where: whereConditions,
      include: [
        {
          model: Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
        {
          model: ExpiryReturnsDetail,
          as: "expiryReturnsDetails",
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
    const totalExpiredBottles = expiryReturns.reduce((sum, expiryReturn) => {
      return (
        sum +
        expiryReturn.expiryReturnsDetails.reduce((detailSum, detail) => {
          return detailSum + detail.bottles_expired;
        }, 0)
      );
    }, 0);

    const totalExpiryValue = expiryReturns.reduce((sum, expiryReturn) => {
      return (
        sum +
        expiryReturn.expiryReturnsDetails.reduce((detailSum, detail) => {
          return detailSum + detail.expiry_value;
        }, 0)
      );
    }, 0);

    // Return formatted response
    res.status(200).json({
      success: true,
      count: expiryReturns.length,
      summary: {
        totalExpiredBottles,
        totalExpiryValue: parseFloat(totalExpiryValue.toFixed(2)),
      },
      data: expiryReturns,
    });
  } catch (error) {
    console.error("Error fetching expiry returns:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiry returns",
      error: error.message,
    });
  }
};

// Get details for a specific expiry return
exports.getExpiryReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const { ExpiryReturn, ExpiryReturnsDetail, Lorry, Product } = req.db;

    const expiryReturn = await ExpiryReturn.findByPk(id, {
      include: [
        {
          model: Lorry,
          as: "lorry",
          attributes: ["lorry_id", "lorry_number"],
        },
        {
          model: ExpiryReturnsDetail,
          as: "expiryReturnsDetails",
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

    if (!expiryReturn) {
      return res.status(404).json({
        success: false,
        message: `Expiry return with ID ${id} not found`,
      });
    }

    // Calculate totals for this specific return
    const totalExpiredBottles = expiryReturn.expiryReturnsDetails.reduce(
      (sum, detail) => sum + detail.bottles_expired,
      0
    );

    const totalExpiryValue = expiryReturn.expiryReturnsDetails.reduce(
      (sum, detail) => sum + detail.expiry_value,
      0
    );

    res.status(200).json({
      success: true,
      summary: {
        totalExpiredBottles,
        totalExpiryValue: parseFloat(totalExpiryValue.toFixed(2)),
      },
      data: expiryReturn,
    });
  } catch (error) {
    console.error("Error fetching expiry return details:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiry return details",
      error: error.message,
    });
  }
};
