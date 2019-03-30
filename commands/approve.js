const Discord = require("discord.js");
const bots = require("../models/bots");

module.exports.run = async (client, message, args, reply) => {
  if (!client.config.admins.includes(message.author.id)) return;
  const bot = args[0];
  if (!bot) return reply("No bot found in args.");

  const bot1 = await bots.findOne({ id: bot, approved: false }, async (err, res) => {
      if (err) console.log(err);
      res.approved = true;
      await res.save().catch(e => console.log(e));
      client.channels.get("561622522798407740").send(`✅ ${message.author} approved <@${bot}> by <@${res.mainOwner}>.`);
      const user = client.users.get(res.mainOwner);
      if (user) return user.send(`:tada: Your bot <@${bot}> was approved by ${message.author.tag}.`);
      reply("Approved bot with sucess.");
  });
};

module.exports.help = {
  name: "approve"
};