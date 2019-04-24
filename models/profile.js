const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  id: String,
  bio: String,
  certifiedDev: Boolean,
  bg: String,
  mod: Boolean,
  admin: Boolean,
  email: String,
  karma: Number,
  totalKarma: Number,
  createdAt: Number
});

module.exports = mongoose.model("profiles", profileSchema);
