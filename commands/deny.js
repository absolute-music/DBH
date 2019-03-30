const Discord = require("discord.js");
const bots = require("../models/bots");

module.exports.run = async (client, message, args, reply) => {
    if (!client.config.admins.includes(message.author.id)) return;
  const bot = args[0];
  const reason = args.slice(1).join(" ");
  if (!bot) return reply("No bot found in args.");
  if (!reason) return reply("No reason found in args.");

  const bot1 = await bots.findOneAndDelete({ id: bot, approved: false }).catch(e => reply("Can't delete that bot smh."));
  client.channels.get("561622522798407740").send(`🗑 ${message.author} rejected <@${bot}> by <@${bot1.mainOwner}.\n\`Reason:\` ${reason}`);
  const user = client.users.get(bot1.mainOwner);
  if (user) return user.send(`Your bot <@${bot}> was rejected by ${message.author.tag} because \`${reason}\``);
  reply("Sucessfully deleted bot from queue.");
};

module.exports.help = {
  name: "deny"
};