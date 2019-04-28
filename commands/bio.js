const Discord = require("discord.js");
const profiles = require("../models/profile.js");

module.exports.run = async (client, message, args, reply) => {
  const myBio = args.join(" ");
  if (!myBio) return reply("Wops, you have to specify a bio.");

  profiles.findOne({ id: message.author.id }, async (err, entry) => {
    if (err) console.log(err);
    if (!entry) {
      const usr = new Profiles({
        id: message.author.id,
        bio: myBio,
        certifiedDev: false,
        bg: null,
        karma: 0,
        totalKarma: 0,
        mod: false,
        admin: false
      });
      await usr.save().catch(e => console.log(e));
      reply("Your bio has been edited on website.");
    } else {
      entry.bio = myBio;
      await entry.save().catch(e => console.log(e));
      reply("Your bio has been edited on website.");
    }
  });
};

module.exports.help = {
  name: "bio"
};
