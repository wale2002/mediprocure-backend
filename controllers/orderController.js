// // controllers/orderController.js
// const Order = require("../models/Order");
// const DrugRequest = require("../models/DrugRequest");

// exports.getAvailableOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ status: "pending" }).populate(
//       "clinicId pharmacyId",
//       "name phone" // Added phone for both clinic and pharmacy
//     );
//     res.status(200).json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.getUserOrders = async (req, res) => {
//   try {
//     let query = {};
//     if (req.user.role === "rider") {
//       query = { riderId: req.user.id };
//     } else if (req.user.role === "clinic") {
//       query = { clinicId: req.user.id };
//     }
//     const orders = await Order.find(query).populate(
//       "requestId clinicId pharmacyId riderId",
//       "name status phone" // Added phone for all refs (clinic/pharmacy/rider)
//     );
//     res.status(200).json(orders);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.acceptOrder = async (req, res) => {
//   try {
//     let order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { riderId: req.user.id, status: "assigned", updatedAt: new Date() },
//       { new: true }
//     );
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     // Populate for response (including phones)
//     order = await Order.findById(order._id).populate(
//       "clinicId pharmacyId riderId",
//       "name phone"
//     );
//     // Update request status
//     await DrugRequest.findByIdAndUpdate(order.requestId, {
//       status: "assigned",
//       updatedAt: new Date(),
//     });
//     res.status(200).json(order);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     let order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { status, updatedAt: new Date() },
//       { new: true }
//     );
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     // Populate for response (including phones)
//     order = await Order.findById(order._id).populate(
//       "clinicId pharmacyId riderId",
//       "name phone"
//     );
//     // Update request status
//     await DrugRequest.findByIdAndUpdate(order.requestId, {
//       status,
//       updatedAt: new Date(),
//     });
//     res.status(200).json(order);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

const Order = require("../models/Order");
const DrugRequest = require("../models/DrugRequest");
const { getPagination, buildSearchQuery } = require("../utils/helpers");

exports.getAvailableOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    // Base query for pending status
    let query = { status: "pending" };

    // Search: by deliveryAddress or totalAmount (as string)
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, ["deliveryAddress"]),
      };
    }

    // Filter: by status (though base is pending, for future extensibility)
    if (filter && filter !== "pending") {
      query.status = filter;
    }

    const orders = await Order.find(query)
      .populate("clinicId pharmacyId", "name phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
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
exports.getUserOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    let query = {};
    if (req.user.role === "rider") {
      query = { riderId: req.user.id };
    } else if (req.user.role === "clinic") {
      query = { clinicId: req.user.id };
    }

    // Search: by deliveryAddress
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, ["deliveryAddress"]),
      };
    }

    // Filter: by status
    if (filter) {
      query.status = filter;
    }

    const orders = await Order.find(query)
      .populate("requestId clinicId pharmacyId riderId", "name status phone")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim);

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
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
// exports.getUserOrders = async (req, res) => {
//   try {
//     const { page = 1, limit = 10, search, filter } = req.query;
//     const { skip, limit: lim } = getPagination(page, limit);

//     let query = {};
//     if (req.user.role === "rider") {
//       query = { riderId: req.user.id };
//     } else if (req.user.role === "clinic") {
//       query = { clinicId: req.user.id };
//     }

//     // Search: by deliveryAddress
//     if (search) {
//       query = {
//         ...query,
//         ...buildSearchQuery(search, ["deliveryAddress"]),
//       };
//     }

//     // Filter: by status
//     if (filter) {
//       query.status = filter;
//     }

//     const orders = await Order.find(query)
//       .populate("requestId clinicId pharmacyId riderId", "name status phone")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(lim);

//     const total = await Order.countDocuments(query);

//     res.status(200).json({
//       orders,
//       pagination: {
//         current: parseInt(page),
//         pages: Math.ceil(total / lim),
//         total,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.acceptOrder = async (req, res) => {
//   try {
//     let order = await Order.findByIdAndUpdate(
//       req.params.id,
//       { riderId: req.user.id, status: "assigned", updatedAt: new Date() },
//       { new: true }
//     );
//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }
//     // Populate for response (including phones)
//     order = await Order.findById(order._id).populate(
//       "clinicId pharmacyId riderId",
//       "name phone"
//     );
//     // Update request status
//     await DrugRequest.findByIdAndUpdate(order.requestId, {
//       status: "assigned",
//       updatedAt: new Date(),
//     });
//     res.status(200).json(order);
//   } catch (error) {
//     res.status(400).json({ message: error.message });
//   }
// };

exports.acceptOrder = async (req, res) => {
  try {
    let order = await Order.findByIdAndUpdate(
      req.params.id,
      { riderId: req.user.id, status: "assigned", updatedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Populate for response (including phones and requestId for consistency)
    order = await Order.findById(order._id).populate(
      "requestId clinicId pharmacyId riderId",
      "name status phone"
    );
    // Update request status
    await DrugRequest.findByIdAndUpdate(order.requestId, {
      status: "assigned",
      updatedAt: new Date(),
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Populate for response (including phones and requestId for consistency)
    order = await Order.findById(order._id).populate(
      "requestId clinicId pharmacyId riderId",
      "name status phone"
    );
    // Update request status
    await DrugRequest.findByIdAndUpdate(order.requestId, {
      status,
      updatedAt: new Date(),
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    // Populate for response (including phones)
    order = await Order.findById(order._id).populate(
      "clinicId pharmacyId riderId",
      "name phone"
    );
    // Update request status
    await DrugRequest.findByIdAndUpdate(order.requestId, {
      status,
      updatedAt: new Date(),
    });
    res.status(200).json(order);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
