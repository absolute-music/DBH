const Discord = require("discord.js");
module.exports.run = async (client, message, args, reply) => {
  var member = message.mentions.members.first() || message.guild.members.get(args[0]) || message.member;
  member = member.user;

  const userBots = await require("../models/bots.js").find({ mainOwner: member.id, approved: true });
  var embed = new Discord.MessageEmbed()
    .setAuthor(`${member.tag}'s bots:`, member.displayAvatarURL({ format: "png", size: 512 }))
    .setColor("BLUE");

  if (userBots.length < 1) {
    embed.setDescription(`<:redTick:568885082321059865> The specified user does not have any published bots.`);
  } else {
    var bots = [];
    for (const bot of userBots) {
      bots.push({ name: bot.name, id: bot.id });
    }
    bots = bots.map(b => `**${b.name}**`);
    embed.setDescription(`User Bots:\n\n${bots.join(",\n")}\n===\nShowing a total of ${userBots.length} bots.`);
  }
  reply(embed);
};

module.exports.help = {
  name: "bots"
};
