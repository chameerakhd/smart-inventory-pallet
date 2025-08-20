// const db = require("../models");
// const CocaColaMonth = db.CocaColaMonth;
const { Op } = require("sequelize");

exports.getAllCocaColaMonths = async (req, res) => {
  try {
    const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance
    const months = await CocaColaMonth.findAll({
      order: [["start_date", "DESC"]],
    });
    res.status(200).json(months);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCocaColaMonthById = async (req, res) => {
  try {
    const { id } = req.params;
    const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance
    const month = await CocaColaMonth.findOne({
      where: { month_id: id },
    });
    if (month) {
      res.status(200).json(month);
    } else {
      res
        .status(404)
        .json({ message: `CocaColaMonth with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCocaColaMonth = async (req, res) => {
  try {
    const { start_date, end_date } = req.body;

    // Validate that start_date is before end_date
    if (new Date(start_date) >= new Date(end_date)) {
      return res.status(400).json({
        message: "Start date must be before end date",
      });
    }

    const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance

    // Check for overlapping periods
    const overlapping = await CocaColaMonth.findOne({
      where: {
        [Op.or]: [
          {
            start_date: {
              [Op.between]: [start_date, end_date],
            },
          },
          {
            end_date: {
              [Op.between]: [start_date, end_date],
            },
          },
          {
            [Op.and]: [
              { start_date: { [Op.lte]: start_date } },
              { end_date: { [Op.gte]: end_date } },
            ],
          },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        message: "The specified date range overlaps with an existing period",
      });
    }

    const newMonth = await CocaColaMonth.create({
      start_date,
      end_date,
    });

    res.status(201).json(newMonth);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create CocaColaMonth",
    });
  }
};

exports.updateCocaColaMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.body;

    // If we're updating dates, validate them
    if (start_date && end_date) {
      // Validate that start_date is before end_date
      if (new Date(start_date) >= new Date(end_date)) {
        return res.status(400).json({
          message: "Start date must be before end date",
        });
      }

      const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance

      // Check for overlapping periods with other months (not this one)
      const overlapping = await CocaColaMonth.findOne({
        where: {
          month_id: { [Op.ne]: id },
          [Op.or]: [
            {
              start_date: {
                [Op.between]: [start_date, end_date],
              },
            },
            {
              end_date: {
                [Op.between]: [start_date, end_date],
              },
            },
            {
              [Op.and]: [
                { start_date: { [Op.lte]: start_date } },
                { end_date: { [Op.gte]: end_date } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        return res.status(400).json({
          message: "The specified date range overlaps with an existing period",
        });
      }
    }

    const [updated] = await CocaColaMonth.update(req.body, {
      where: { month_id: id },
    });

    if (updated) {
      const updatedMonth = await CocaColaMonth.findOne({
        where: { month_id: id },
      });
      return res.status(200).json(updatedMonth);
    }

    throw new Error("CocaColaMonth not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteCocaColaMonth = async (req, res) => {
  try {
    const { id } = req.params;
    const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance
    const deleted = await CocaColaMonth.destroy({
      where: { month_id: id },
    });
    if (deleted) {
      return res.status(204).send("CocaColaMonth deleted");
    }
    throw new Error("CocaColaMonth not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getCurrentCocaColaMonth = async (req, res) => {
  try {
    const today = new Date();

    const CocaColaMonth = req.db.CocaColaMonth; // Use the CocaColaMonth model from the database instance
    const currentMonth = await CocaColaMonth.findOne({
      where: {
        start_date: { [Op.lte]: today },
        end_date: { [Op.gte]: today },
      },
    });

    if (currentMonth) {
      res.status(200).json(currentMonth);
    } else {
      res
        .status(404)
        .json({ message: "No current CocaCola month found for today's date" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
