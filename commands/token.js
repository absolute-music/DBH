const Discord = require("discord.js");

function makeid(length) {
   var result = "";
   var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   var charactersLength = characters.length;
   for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

module.exports.run = async (client, message, args, reply) => {
  if (!args[0]) return reply("You have to specify an option. The valid ones are `show`,  `regenerate` or `generate`.");;
  var bot = message.mentions.users.first() || { id: args[1] };
  if (bot) bot = bot.id;
  if (!bot) return reply("Please specify a bot.");

  var userBots = await require("../models/bots.js").find();
  if (userBots.findIndex(b => b.id === bot) < 0) return reply("That bot is not listed.");
  userBots = userBots.filter(b => b.mainOwner === message.author.id);
  if (userBots.length < 1) return reply("You don't have any bots listed.");
  if (userBots.findIndex(b => b.id === bot) < 0) return reply("You don't own acces to specified bot.");

  if (args[0].toLowerCase() === "show") {
    const botIndex = userBots.findIndex(b => b.id === bot);
    const theBot = userBots[botIndex];
    if (theBot.token === null) return reply("Please generate a token using this command's `generate` option.");
    message.author.send(`The token for this bot is \`${theBot.token}\`.`);
    reply("Token has been DMed to you.");
  } else if (args[0].toLowerCase() === "generate") {
    const botIndex = userBots.findIndex(b => b.id === bot);
    const theBot = userBots[botIndex];
    require("../models/bots.js").findOne({ id: theBot.id }, async (err, bott) => {
      const newToken = `XA-${makeid(12)}`;
      bott.token = newToken;
      await bott.save().catch(e => console.log(e));
      reply("Token has been generated for this bot. Please use this command's `show` option to view it.");
    });
  } else if (args[0].toLowerCase() === "regenerate") {
    const botIndex = userBots.findIndex(b => b.id === bot);
    const theBot = userBots[botIndex];
    require("../models/bots.js").findOne({ id: theBot.id }, async (err, bott) => {
      const newToken = `XA-${makeid(12)}`;
      bott.token = newToken;
      await bott.save().catch(e => console.log(e));
      reply("Token has been regenerated for this bot. Please use this command's `show` option to view it.");
    });
  } else {
    reply("You have to specify am option. The valid ones are `show`,  `regenerate` or `generate`.");
  }
};

module.exports.help = {
  name: "token"
};
