const Discord = require("discord.js");
const profiles = require("../models/profile.js");

module.exports.run = async (client, message, args, reply) => {
  var member = message.mentions.members.first() || message.guild.members.get(args[0]) || message.member;
  member = member.user;

  var profile = await profiles.findOne({ id: member.id });
  if (!profile) profile = { id: member.id, bio: "I'm a very mysterious person.", certified: null, mod: null, admin: null };

  const profileEmbed = new Discord.MessageEmbed()
    .setAuthor(member.tag, member.displayAvatarURL({ format: "png", size: 512 }))
    .setColor("BLUE")
    .addField(`User:`, `${member.tag}`)
    .addField(`Bio:`, `${profile.bio}`);
  reply(profileEmbed);
};

module.exports.help = {
  name: "profile"
};
