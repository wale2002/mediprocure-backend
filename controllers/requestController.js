const DrugRequest = require("../models/DrugRequest");
const Order = require("../models/Order");
const Product = require("../models/Product");
const { getPagination, buildSearchQuery } = require("../utils/helpers");
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");

// controllers/requestController.js (updated submitPhotoRequest for multiple files)
exports.submitPhotoRequest = async (req, res) => {
  try {
    const { deliveryAddress, patientInfo } = req.body;
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          cloudinary.uploadImage(file.path)
        );
        const results = await Promise.all(uploadPromises);
        photoUrls = results.map((result) => result.secure_url);
      } catch (uploadError) {
        console.warn(
          "Photo upload failed, proceeding without photos:",
          uploadError.message
        );
      }
    } else {
      return res
        .status(400)
        .json({ message: "At least one photo file is required" });
    }
    const request = await DrugRequest.create({
      clinicId: req.user.id,
      clinicName: req.user.name,
      type: "photo",
      photoUrls, // Changed to array for multiple photos
      deliveryAddress,
      patientInfo,
    });
    // Populate clinicId with full details including phone
    const populatedRequest = await DrugRequest.findById(request._id).populate(
      "clinicId",
      "name phone organization address email role"
    );
    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  } finally {
    // Clean up all uploaded local files
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.warn("Failed to delete local file:", unlinkError.message);
        }
      });
    }
  }
};

// controllers/requestController.js (updated submitInventoryRequest)
exports.submitInventoryRequest = async (req, res) => {
  try {
    const { selectedProducts, deliveryAddress, patientInfo } = req.body;

    // Validate: selectedProducts must be array
    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res
        .status(400)
        .json({ message: "selectedProducts must be a non-empty array" });
    }

    // Add product names if missing (fetch from DB)
    const enrichedProducts = await Promise.all(
      selectedProducts.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        return {
          ...item,
          productName: product.name,
        };
      })
    );

    const request = await DrugRequest.create({
      clinicId: req.user.id,
      clinicName: req.user.name,
      type: "inventory",
      selectedProducts: enrichedProducts, // Use directly, no JSON.parse
      deliveryAddress,
      patientInfo,
    });
    // Populate clinicId with full details including phone
    const populatedRequest = await DrugRequest.findById(request._id).populate(
      "clinicId",
      "name phone organization address email role"
    );
    res.status(201).json(populatedRequest);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    // Base query for pending status
    let query = { status: "pending" };

    // Search: by clinicName, deliveryAddress, or patientInfo
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, [
          "clinicName",
          "deliveryAddress",
          "patientInfo",
        ]),
      };
    }

    // Filter: by type (photo/inventory)
    if (filter && filter === "photo") {
      query.type = "photo";
    } else if (filter && filter === "inventory") {
      query.type = "inventory";
    }

    const requests = await DrugRequest.find(query)
      .populate("clinicId", "name organization phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim);

    const total = await DrugRequest.countDocuments(query);

    res.status(200).json({
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / lim),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// New endpoint: Get clinic request history (all past/completed requests, excluding pending)
exports.getClinicRequestHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    // Base query for clinic's history: exclude pending requests
    let query = {
      clinicId: req.user.id,
      status: { $ne: "pending" }, // History typically means processed/completed requests
    };

    // Search: by deliveryAddress, patientInfo, or rejectionReason
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, [
          "deliveryAddress",
          "patientInfo",
          "rejectionReason",
        ]),
      };
    }

    // Filter: by status (e.g., confirmed, rejected) or type (photo/inventory)
    if (filter) {
      if (filter === "photo" || filter === "inventory") {
        query.type = filter;
      } else {
        query.status = filter;
      }
    }

    const requests = await DrugRequest.find(query)
      .populate("clinicId", "name organization phone")
      .sort({ updatedAt: -1 }) // Sort by updatedAt for history view
      .skip(skip)
      .limit(lim);

    // Optionally populate related orders for confirmed requests
    const requestsWithOrders = await Promise.all(
      requests.map(async (request) => {
        if (request.status === "confirmed") {
          const order = await Order.findOne({
            requestId: request._id,
          }).populate("pharmacyId", "name organization phone");
          return { ...request.toObject(), order };
        }
        return request;
      })
    );

    const total = await DrugRequest.countDocuments(query);

    res.status(200).json({
      requests: requestsWithOrders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / lim),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUserRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    // Base query for user's requests
    let query = { clinicId: req.user.id };

    // Search: by deliveryAddress or patientInfo
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, ["deliveryAddress", "patientInfo"]),
      };
    }

    // Filter: by status (pending, confirmed, rejected, etc.)
    if (filter) {
      query.status = filter;
    }

    const requests = await DrugRequest.find(query)
      .populate("clinicId", "name organization phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim);

    const total = await DrugRequest.countDocuments(query);

    res.status(200).json({
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / lim),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addItemsToPhotoRequest = async (req, res) => {
  try {
    const { id } = req.params; // Request ID
    const { selectedProducts } = req.body; // Array like [{ productId, quantity }, ...]

    // Validate: Pharmacy access + photo type + non-empty items
    const request = await DrugRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.type !== "photo") {
      return res
        .status(400)
        .json({ message: "Only photo requests can have items added" });
    }
    if (req.user.role !== "pharmacy") {
      // FIXED: Only check role; no clinicId mismatch (always false)
      return res.status(403).json({ message: "Not authorized" });
    }
    if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
      return res
        .status(400)
        .json({ message: "selectedProducts must be a non-empty array" });
    }

    // Enrich with product names (similar to submitInventoryRequest)
    const enrichedProducts = await Promise.all(
      selectedProducts.map(async (item) => {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        return {
          ...item,
          productName: product.name,
        };
      })
    );

    // Update request
    request.selectedProducts = enrichedProducts;
    request.updatedAt = new Date();
    await request.save();

    // Populate for response
    const populatedRequest = await DrugRequest.findById(request._id).populate(
      "clinicId",
      "name phone organization address email role"
    );

    res.status(200).json({
      message: "Items added to photo request",
      request: populatedRequest,
    });
  } catch (error) {
    console.error("Add items error:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.confirmRequest = async (req, res) => {
  try {
    const request = await DrugRequest.findById(req.params.id).populate(
      "clinicId",
      "name phone" // Added phone for clinic
    );
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // No longer block for missing products—always confirm

    request.status = "confirmed";
    request.updatedAt = new Date();
    await request.save();

    let totalAmount = 0;
    const orderItems = [];
    let hasProducts = false;

    if (request.selectedProducts && request.selectedProducts.length > 0) {
      hasProducts = true;
      for (let item of request.selectedProducts) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res
            .status(404)
            .json({ message: `Product ${item.productId} not found` });
        }
        if (product.quantity < item.quantity) {
          return res
            .status(400)
            .json({ message: `Insufficient stock for ${product.name}` });
        }
        product.quantity -= item.quantity;
        await product.save();
        totalAmount += product.price * item.quantity;
        orderItems.push({
          productId: item.productId,
          productName: product.name, // Use current name (in case updated)
          quantity: item.quantity,
          price: product.price,
        });
      }
    }

    // Always create Order (even if no products)
    const order = await Order.create({
      requestId: request._id,
      clinicId: request.clinicId,
      pharmacyId: req.user.id,
      items: orderItems,
      totalAmount,
      deliveryAddress: request.deliveryAddress,
      status: "pending",
    });

    // Populate order for response (including phones for clinic/pharmacy)
    const populatedOrder = await Order.findById(order._id).populate(
      "clinicId pharmacyId",
      "name phone"
    );

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error("Confirm request error:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await DrugRequest.findByIdAndUpdate(
      req.params.id,
      { status: "rejected", rejectionReason: reason, updatedAt: new Date() },
      { new: true }
    ).populate("clinicId", "name phone organization address email role");
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }
    res.status(200).json({ message: "Request rejected", request });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// New endpoint to download a specific photo by index (for multiple photos)
// New endpoint to download a specific photo by index (for multiple photos)
exports.downloadPhoto = async (req, res) => {
  try {
    const { id, index } = req.params; // id: request ID, index: photo index (0-based)
    const request = await DrugRequest.findById(id).populate(
      "clinicId",
      "name phone organization"
    );
    if (
      !request ||
      request.type !== "photo" ||
      !request.photoUrls ||
      !request.photoUrls[index]
    ) {
      return res.status(404).json({ message: "Photo not found" });
    }
    if (
      req.user.role !== "pharmacy" &&
      request.clinicId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const photoUrl = request.photoUrls[index];
    const photoIndex = parseInt(index);

    // Fetch the image from Cloudinary
    const response = await fetch(
      photoUrl.replace(
        /\/image\/upload\/(?!f_)/,
        "/image/upload/fl_attachment:f_jpg,q_100/"
      )
    ); // Force download format
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer()); // Adjusted for standard Node.js fetch (arrayBuffer to Buffer)
    const filename = `drug-photo-${request._id}-${photoIndex + 1}.jpg`;

    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error("Download photo error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Optional: Endpoint to download all photos as a ZIP (requires additional library like archiver)
const archiver = require("archiver");
exports.downloadAllPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await DrugRequest.findById(id).populate(
      "clinicId",
      "name phone organization"
    );
    if (
      !request ||
      request.type !== "photo" ||
      !request.photoUrls ||
      request.photoUrls.length === 0
    ) {
      return res.status(404).json({ message: "No photos found" });
    }
    if (
      req.user.role !== "pharmacy" &&
      request.clinicId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="drug-photos-${request._id}.zip"`
    );

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    for (let i = 0; i < request.photoUrls.length; i++) {
      const photoUrl = request.photoUrls[i];
      const response = await fetch(photoUrl);
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer()); // Adjusted for standard Node.js fetch
        archive.append(buffer, { name: `photo-${i + 1}.jpg` });
      }
    }

    archive.finalize();
  } catch (error) {
    console.error("Download all photos error:", error);
    res.status(500).json({ message: error.message });
  }
};
