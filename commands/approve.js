const Discord = require("discord.js");
const bots = require("../models/bots");
const profiles = require("../models/profile");

module.exports.run = async (client, message, args, reply) => {
  const userProfile = await profiles.findOne({ id: message.author.id });
  if (!userProfile || userProfile.mod !== true && userProfile.admin !== true) return reply(`You can't do this.`);

  var bot = message.mentions.users.first() || { id: args[0] };
  if (bot) bot = bot.id;
  if (!bot) return reply("<a:aRedTick:568884586818306048> Please specify a bot to approve.");

  await bots.findOne({ id: bot }, async (err, res) => {
    if (err) console.log(err);
    if (!res) return reply(`<a:aRedTick:568884586818306048> That bot was not found in queue.`);
    res.approved = true;
    await res.save().catch(e => console.log(e));
    if (client.guilds.get("560865387206672384").members.get(res.mainOwner)) {
      client.guilds.get("560865387206672384").members.get(res.mainOwner).roles.add(client.guilds.get("560865387206672384").roles.find(r => r.name === "Developer"));
    }

    for (const owner of res.owners) {
      if (client.guilds.get("560865387206672384").members.get(owner)) client.guilds.get("560865387206672384").members.get(owner).roles.add(client.guilds.get("560865387206672384").roles.find(r => r.name === "Developer"));
    }

    var allOwners = res.owners;
    allOwners.unshift(res.mainOwner);
    allOwners = allOwners.map(u => `<@${u}>`);
    await client.channels.get("561622522798407740").send(`<@${res.id}> by ${allOwners.join(" ")} has been approved by <@${message.author.id}>.\n**URL**: https://discordhouse.org/bot/${bot}`);
    await client.channels.get("561659713515945985").send(`<@${res.id}> by ${allOwners.join(" ")} has been approved by <@${message.author.id}>.\n**URL**: https://discordhouse.org/bot/${bot}`);
    const user = client.users.get(res.mainOwner);
    if (user) user.send(`Your bot <@${bot}> was approved by ${message.author.tag}.`);
    client.emit("updatePresence");
    reply(`Sucessfully approved <@${bot}>.`);
  });
};

module.exports.help = {
  name: "approve"
};
