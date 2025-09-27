// utils/helpers.js

// Helper function for pagination
exports.getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

// Helper function for building search query
exports.buildSearchQuery = (searchTerm, modelFields = []) => {
  if (!searchTerm) return {};
  const searchRegex = { $regex: searchTerm, $options: "i" };
  const orConditions = modelFields.map((field) => ({ [field]: searchRegex }));
  return { $or: orConditions };
};
