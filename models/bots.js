const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
  id: String,
  mainOwner: String,
  owners: Array,
  library: String,
  upvotes: Number,
  totalVotes: Number,
  website: String,
  votes: Array,
  github: String,
  shortDesc: String,
  longDesc: Object,
  server: String,
  prefix: String,
  verified: Boolean,
  trusted: Boolean,
  certified: Boolean,
  vanityUrl: String,
  stats: Object,
  invite: String,
  featured: Object,
  tags: Array,
  token: String
});

module.exports = mongoose.model("bots", botSchema);