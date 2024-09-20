const mongoose = require("mongoose");

const connectDB = async (uri) => {
  await mongoose.connect(uri, {});
};

module.exports = connectDB;
