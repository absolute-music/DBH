const Discord = require("discord.js");
const profiles = require("../models/profile.js");

module.exports.run = async (client, message, args, reply) => {
  var bot = message.mentions.users.first() || { id: args[0] };
  if (bot) bot = bot.id;

  const theBot = await require("../models/bots.js").findOne({ id: bot });
  if (!theBot) return reply("Bot not listed on website.");

  const owner = client.users.get(theBot.mainOwner);
  if (!owner) return reply("Owner not on user cache, aborted.");
  const userBot = client.users.get(theBot.id);
  if (!userBot) return reply("Bot not on user cache, aborted.");
  theBot.owners.unshift(theBot.mainOwner);
  var otherOwners = [];

  for (const sepparateOwner of theBot.owners) {
    if (client.users.get(sepparateOwner)) {
      otherOwners.push(client.users.get(sepparateOwner));
    } else {
      otherOwners.push({ tag: "Unknown#0000" });
    }
  }
  otherOwners = otherOwners.map(u => u.tag);

  const botEmbed = new Discord.MessageEmbed()
    .setAuthor(owner.tag, owner.displayAvatarURL({ format: "png", size: 512 }))
    .setColor("BLUE")
    .addField("Name:", `${theBot.name}`)
    .addField("Monthly Upvotes:", `${theBot.upvotes.toLocaleString()}`)
    .addField("Library:", `${theBot.library}`)
    .addField("Website:", `${theBot.website}`)
    .addField("GitHub:", `${theBot.github}`)
    .addField("Prefix:", `${theBot.prefix}`)
    .addField("Support Server:", `${theBot.server}`)
    .addField("Invite:", `${theBot.invite}`)
    .addField(`On ${theBot.serverCount === 0 ? "N/A" : theBot.serverCount} Servers`, `The bot is made by ${otherOwners.join(", ")}.`)
    .setThumbnail(userBot.displayAvatarURL())
    .setDescription(theBot.shortDesc)
  reply(botEmbed);
};

module.exports.help = {
  name: "bot"
};
