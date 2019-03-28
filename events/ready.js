const Discord = require("discord.js"); // eslint-disable-line no-unused-vars
const dashboard = require("../dashboard/index.js");

exports.run = async (client) => {
  console.log(`${client.user.username} is ready.`);
  dashboard(client);
};