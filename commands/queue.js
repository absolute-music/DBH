const Discord = require("discord.js");
const profiles = require("../models/profile.js");

module.exports.run = async (client, message, args, reply) => {
  const userProfile = await profiles.findOne({ id: message.author.id });
  if (!userProfile || userProfile.mod !== true && userProfile.admin !== true) return reply(`You can't do this.`);

  const userBots = await require("../models/bots.js").find({ approved: false });
  var embed = new Discord.MessageEmbed()
    .setAuthor(`Unverified Bots:`, message.author.displayAvatarURL({ format: "png", size: 128 }))
    .setColor("BLUE");

  if (userBots.length < 1) {
    embed.setDescription(`No bots pending verification.`);
  } else {
    var bots = [];
    for (const bot of userBots) {
      bots.push({ name: bot.name, id: bot.id });
    }
    bots = bots.map(b => `**${b.name}** (ID: ${b.id})`);
    embed.setDescription(`Unverified BotS:\n\n${bots.join(",\n")}\n===\nShowed a total of ${userBots.length} bots.`);
  }
  reply(embed);
};

module.exports.help = {
  name: "queue"
};
