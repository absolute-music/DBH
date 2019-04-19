const Discord = require("discord.js");
const bots = require("../models/bots");

module.exports.run = async (client, message, args, reply) => {
  if (!client.config.admins.includes(message.author.id)) return;
  const bot = args[0];
  if (!bot) return reply("<a:aRedTick:568884586818306048> Please specify a bot to approve.");

  const bot1 = await bots.findOne({ id: bot, approved: false }, async (err, res) => {
    if (err) console.log(err);
    if (!res) return reply(`<a:aRedTick:568884586818306048> That bot was not found in queue.`);
    res.approved = true;
    await res.save().catch(e => console.log(e));
    await client.channels.get("561622522798407740").send(`<a:aGreenTick:568884816313974804> <@${bot}> by <@${res.mainOwner}> was approved by ${message.author}.\nURL: https://discordhouse.org/bot/${bot}`);
    const user = client.users.get(res.mainOwner);
    if (user) user.send(`:tada: Your bot <@${bot}> was approved by ${message.author.tag}.`);
    client.emit("updatePresence");
    reply(`<a:aGreenTick:568884816313974804> Bot has been approved.`);
  });
};

module.exports.help = {
  name: "approve"
};
