// // controllers/productController.js
// const fs = require("fs");
// const Product = require("../models/Product");
// const {
//   uploadImage,
//   deleteImage,
//   getPublicIdFromUrl,
// } = require("../utils/cloudinary");

// exports.getInventory = async (req, res) => {
//   try {
//     const products = await Product.find({ pharmacyId: req.user.id }).populate(
//       "pharmacyId",
//       "name"
//     );
//     res.status(200).json(products);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// exports.addProduct = async (req, res) => {
//   try {
//     const { name, description, category, price, quantity } = req.body;

//     // Validate required fields
//     if (!name || !description || !category || !price || !quantity) {
//       return res.status(400).json({
//         message:
//           "Missing required fields: name, description, category, price, quantity",
//       });
//     }

//     const priceValue = parseFloat(price);
//     const quantityValue = parseInt(quantity, 10);

//     if (isNaN(priceValue) || isNaN(quantityValue)) {
//       return res
//         .status(400)
//         .json({ message: "Invalid number format for price or quantity" });
//     }

//     let imageUrl = "";
//     if (req.file) {
//       try {
//         const result = await uploadImage(req.file.path);
//         imageUrl = result.secure_url;
//       } catch (uploadError) {
//         console.warn(
//           "Image upload failed, proceeding without image:",
//           uploadError.message
//         );
//       }
//     }

//     const product = await Product.create({
//       name,
//       description,
//       price: priceValue,
//       quantity: quantityValue,
//       imageUrl,
//       category,
//       pharmacyId: req.user.id,
//     });

//     res.status(201).json(product);
//   } catch (error) {
//     console.error("Add product error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: "Server error while adding product" });
//   } finally {
//     if (req.file) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (unlinkError) {
//         console.warn("Failed to delete local file:", unlinkError.message);
//       }
//     }
//   }
// };

// exports.updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const product = await Product.findOne({ _id: id, pharmacyId: req.user.id });

//     if (!product) {
//       return res
//         .status(404)
//         .json({ message: "Product not found or you do not have permission" });
//     }

//     const updateData = { ...req.body };

//     if (req.body.price) {
//       updateData.price = parseFloat(req.body.price);
//       if (isNaN(updateData.price)) {
//         return res
//           .status(400)
//           .json({ message: "Invalid number format for price" });
//       }
//     }

//     if (req.body.quantity) {
//       updateData.quantity = parseInt(req.body.quantity, 10);
//       if (isNaN(updateData.quantity)) {
//         return res
//           .status(400)
//           .json({ message: "Invalid number format for quantity" });
//       }
//     }

//     if (req.file) {
//       try {
//         const result = await uploadImage(req.file.path);
//         updateData.imageUrl = result.secure_url;

//         if (product.imageUrl) {
//           const oldPublicId = getPublicIdFromUrl(product.imageUrl);
//           if (oldPublicId) {
//             await deleteImage(oldPublicId);
//           }
//         }
//       } catch (uploadError) {
//         console.warn(
//           "Image upload failed, keeping old image:",
//           uploadError.message
//         );
//       }
//     }

//     Object.assign(product, updateData);
//     await product.save();

//     res.status(200).json(product);
//   } catch (error) {
//     console.error("Update product error:", error);
//     if (error.name === "ValidationError") {
//       return res.status(400).json({ message: error.message });
//     }
//     res.status(500).json({ message: "Server error while updating product" });
//   } finally {
//     if (req.file) {
//       try {
//         fs.unlinkSync(req.file.path);
//       } catch (unlinkError) {
//         console.warn("Failed to delete local file:", unlinkError.message);
//       }
//     }
//   }
// };

// exports.deleteProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const product = await Product.findOneAndDelete({
//       _id: id,
//       pharmacyId: req.user.id, // Ensure product belongs to the user
//     });

//     if (!product) {
//       return res
//         .status(404)
//         .json({ message: "Product not found or you do not have permission" });
//     }

//     if (product.imageUrl) {
//       const publicId = getPublicIdFromUrl(product.imageUrl);
//       if (publicId) {
//         await deleteImage(publicId);
//       }
//     }

//     res.status(200).json({ message: "Product deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

const fs = require("fs");
const Product = require("../models/Product");
const {
  uploadImage,
  deleteImage,
  getPublicIdFromUrl,
} = require("../utils/cloudinary");
const { getPagination, buildSearchQuery } = require("../utils/helpers");

exports.getInventory = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, filter } = req.query;
    const { skip, limit: lim } = getPagination(page, limit);

    // Base query for user's products
    let query = { pharmacyId: req.user.id };

    // Search: by name or description
    if (search) {
      query = {
        ...query,
        ...buildSearchQuery(search, ["name", "description"]),
      };
    }

    // Filter: by category
    if (filter) {
      query.category = { $regex: filter, $options: "i" };
    }

    const products = await Product.find(query)
      .populate("pharmacyId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(lim);

    const total = await Product.countDocuments(query);

    res.status(200).json({
      products,
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

exports.addProduct = async (req, res) => {
  try {
    const { name, description, category, price, quantity } = req.body;

    // Validate required fields
    if (!name || !description || !category || !price || !quantity) {
      return res.status(400).json({
        message:
          "Missing required fields: name, description, category, price, quantity",
      });
    }

    const priceValue = parseFloat(price);
    const quantityValue = parseInt(quantity, 10);

    if (isNaN(priceValue) || isNaN(quantityValue)) {
      return res
        .status(400)
        .json({ message: "Invalid number format for price or quantity" });
    }

    let imageUrl = "";
    if (req.file) {
      try {
        const result = await uploadImage(req.file.path);
        imageUrl = result.secure_url;
      } catch (uploadError) {
        console.warn(
          "Image upload failed, proceeding without image:",
          uploadError.message
        );
      }
    }

    const product = await Product.create({
      name,
      description,
      price: priceValue,
      quantity: quantityValue,
      imageUrl,
      category,
      pharmacyId: req.user.id,
    });

    // Populate for response
    const populatedProduct = await Product.findById(product._id).populate(
      "pharmacyId",
      "name"
    );

    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error("Add product error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while adding product" });
  } finally {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn("Failed to delete local file:", unlinkError.message);
      }
    }
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOne({ _id: id, pharmacyId: req.user.id });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or you do not have permission" });
    }

    const updateData = { ...req.body };

    if (req.body.price) {
      updateData.price = parseFloat(req.body.price);
      if (isNaN(updateData.price)) {
        return res
          .status(400)
          .json({ message: "Invalid number format for price" });
      }
    }

    if (req.body.quantity) {
      updateData.quantity = parseInt(req.body.quantity, 10);
      if (isNaN(updateData.quantity)) {
        return res
          .status(400)
          .json({ message: "Invalid number format for quantity" });
      }
    }

    if (req.file) {
      try {
        const result = await uploadImage(req.file.path);
        updateData.imageUrl = result.secure_url;

        if (product.imageUrl) {
          const oldPublicId = getPublicIdFromUrl(product.imageUrl);
          if (oldPublicId) {
            await deleteImage(oldPublicId);
          }
        }
      } catch (uploadError) {
        console.warn(
          "Image upload failed, keeping old image:",
          uploadError.message
        );
      }
    }

    Object.assign(product, updateData);
    await product.save();

    // Populate for response
    const populatedProduct = await Product.findById(product._id).populate(
      "pharmacyId",
      "name"
    );

    res.status(200).json(populatedProduct);
  } catch (error) {
    console.error("Update product error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error while updating product" });
  } finally {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn("Failed to delete local file:", unlinkError.message);
      }
    }
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({
      _id: id,
      pharmacyId: req.user.id, // Ensure product belongs to the user
    });

    if (!product) {
      return res
        .status(404)
        .json({ message: "Product not found or you do not have permission" });
    }

    if (product.imageUrl) {
      const publicId = getPublicIdFromUrl(product.imageUrl);
      if (publicId) {
        await deleteImage(publicId);
      }
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
