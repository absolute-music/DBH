const Discord = require("discord.js");
const bots = require("../models/bots");
const profiles = require("../models/profile");

module.exports.run = async (client, message, args, reply) => {

  const userProfile = await profiles.findOne({ id: message.author.id });
  if (!userProfile || userProfile.admin !== true) return reply(`You can't do this.`);
  var bot = message.mentions.users.first() || { id: args[0] };
  if (bot) bot = bot.id;
  if (!bot) return reply("<a:aRedTick:568884586818306048> Please specify a bot to set vanity URL.");
  if (!args[1]) return  reply(`Please specify a vanity URL`)
  if (args[1].length > 30 ) return reply(`The vanity URL can have a maximum of 30 characters`)
  if (args[2]) return reply(`The vanity URL should be one string`)
  await bots.findOne({ id: bot }, async (err, res) => {
    if (err) console.log(err);
    if (!res) return reply(`<a:aRedTick:568884586818306048> That bot was not found.`);
    res.vanityUrl = args[1];
    await res.save().catch(e => console.log(e));
    reply(`Vanity URL has been set to: \nhttps://discordhouse.org/bot/${args[1]}`)
   
  });


};

module.exports.help = {
  name: "vanity"
};
