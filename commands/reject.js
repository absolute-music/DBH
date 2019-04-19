const Discord = require("discord.js");
const bots = require("../models/bots");

module.exports.run = async (client, message, args, reply) => {
    if (!client.config.admins.includes(message.author.id)) return;
  const bot = args[0];
  const reason = args.slice(1).join(" ");
  if (!bot) return reply("<a:aRedTick:568884586818306048> Please specify a bot to reject.");
  if (!reason) return reply("<a:aRedTick:568884586818306048> Please specify a reason for rejection.");

  const bot1 = await bots.findOne({ id: bot, approved: false });
  if (!bot1) return reply("<a:aRedTick:568884586818306048> That bot was not found in queue.")
  
  client.channels.get("561622522798407740").send(`<a:aRedTick:568884586818306048> <@${bot}> by <@${bot1.mainOwner}> was rejected by ${message.author}.\n**Reason**: ${reason}`);
  const user = client.users.get(bot1.mainOwner);
  if (user) user.send(`<a:aRedTick:568884586818306048> Your bot <@${bot}> was rejected by ${message.author.tag}.\n**Reason**: ${reason}`);
  reply("<a:aRedTick:568884586818306048> Bot has been rejected.");
};

module.exports.help = {
  name: "reject"
};
