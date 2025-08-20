// const db = require("../models");
// const LoadingDetail = db.LoadingDetail;

exports.getAllLoadingDetails = async (req, res) => {
  try {
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const loadingDetails = await LoadingDetail.findAll();
    res.status(200).json(loadingDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoadingDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const loadingDetail = await LoadingDetail.findOne({
      where: { loading_detail_id: id },
    });
    if (loadingDetail) {
      res.status(200).json(loadingDetail);
    } else {
      res
        .status(404)
        .json({ message: `Loading detail with id ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createLoadingDetail = async (req, res) => {
  try {
    const {
      loading_id,
      product_id,
      cases_loaded,
      bottles_loaded,
      total_bottles_loaded,
      value,
    } = req.body;

    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const newLoadingDetail = await LoadingDetail.create({
      loading_id,
      product_id,
      cases_loaded,
      bottles_loaded,
      total_bottles_loaded,
      value,
    });

    res.status(201).json(newLoadingDetail);
  } catch (error) {
    res.status(500).json({
      error: error.message,
      message: "Failed to create loading detail",
    });
  }
};

exports.updateLoadingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const [updated] = await LoadingDetail.update(req.body, {
      where: { loading_detail_id: id },
    });
    if (updated) {
      const updatedLoadingDetail = await LoadingDetail.findOne({
        where: { loading_detail_id: id },
      });
      return res.status(200).json(updatedLoadingDetail);
    }
    throw new Error("Loading detail not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.deleteLoadingDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const deleted = await LoadingDetail.destroy({
      where: { loading_detail_id: id },
    });
    if (deleted) {
      return res.status(204).send("Loading detail deleted");
    }
    throw new Error("Loading detail not found");
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getLoadingDetailsByLoadingId = async (req, res) => {
  try {
    const { loadingId } = req.params;
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const loadingDetails = await LoadingDetail.findAll({
      where: { loading_id: loadingId },
    });
    res.status(200).json(loadingDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLoadingDetailsByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    const LoadingDetail = req.db.LoadingDetail; // Use the LoadingDetail model from the database instance
    const loadingDetails = await LoadingDetail.findAll({
      where: { product_id: productId },
    });
    res.status(200).json(loadingDetails);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
