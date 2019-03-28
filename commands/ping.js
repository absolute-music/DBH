const Discord = require("discord.js");

module.exports.run = async (client, message, args, reply) => {
  const m = await reply("Pong!");
  m.edit(`*${m.createdTimestamp - message.createdTimestamp}ms*`);
};

module.exports.help = {
  name: "ping"
};