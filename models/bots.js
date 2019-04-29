const mongoose = require("mongoose");

const botSchema = new mongoose.Schema({
  id: String,
  name: String,
  mainOwner: String,
  owners: Array,
  library: String,
  upvotes: Number,
  totalVotes: Number,
  website: String,
  votes: Array,
  rates: Array,
  github: String,
  shortDesc: String,
  longDesc: String,
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
  token: String,
  shardID: Number,
  serverCount: Number,
  shardCount: Number,
  approved: Boolean,
  createdAt: Number
});

module.exports = mongoose.model("bots", botSchema);
