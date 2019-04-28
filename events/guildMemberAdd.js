const Discord = require("discord.js"); // eslint-disable-line no-unused-vars
const dashboard = require("../dashboard/index.js");

exports.run = async (client, member) => {
  if (member.guild.id !== "560865387206672384") return;
  if (member.user.bot) member.roles.add(member.guild.roles.find(role => role.id === "568873150809636885"))
};
