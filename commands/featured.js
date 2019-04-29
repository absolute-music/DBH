const Discord = require("discord.js");
const bots = require("../models/bots");
const profiles = require("../models/profile");

module.exports.run = async (client, message, args, reply) => {

  const userProfile = await profiles.findOne({ id: message.author.id });
  if (!userProfile || userProfile.admin !== true) return reply(`You can't do this.`);
  var bot = message.mentions.users.first() || { id: args[0] };
  if (bot) bot = bot.id;
  if (!bot) return reply("<a:aRedTick:568884586818306048> Please specify a bot to feature.");
  if (!args[1]) return  reply(`Please provide an argument \`add/del\``)
  if (args[1] !== 'add' && args[1] !== 'del'  ) return reply(`Please provide a correct argument \`add/del\``)
  await bots.findOne({ id: bot }, async (err, res) => {
    if (err) console.log(err);
    if (!res) return reply(`<a:aRedTick:568884586818306048> That bot was not found.`);
    if(args[1] == 'add') res.featured = true;
    if(args[1] == 'del') res.featured = false;
    await res.save().catch(e => console.log(e));
    if(args[1] == 'add')  reply(`${res.name} was added to featured bots.`)
    if(args[1] == 'del')  reply(`${res.name} was removed from featured bots.`)
   
   
  });


};

module.exports.help = {
  name: "featured"
};
