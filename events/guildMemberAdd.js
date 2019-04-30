const Discord = require("discord.js"); // eslint-disable-line no-unused-vars
const dashboard = require("../dashboard/index.js");
const profiles = require("../models/profile.js");

exports.run = async (client, member) => {

  if (member.guild.id == "561629999111602185" && member.user.bot == false){
 profiles.findOne({ id: member.id }, async (err, entry) => {  
  if (err) console.log(err);
  if (!entry){
    try {
      await member.send('**Unauthorized Access**\nThe Discord Bot House verification center is only for staff members.');
    } catch(err){
      console.log(err)
    }
    member.kick('Not allowed')
    return
  }  
  if (entry.mod == false && entry.mod == false ){
    try {
      await member.send('**Unauthorized Access**\nThe Discord Bot House verification center is only for staff members.');
    } catch(err){
      console.log(err)
    }    
    member.kick('Not allowed')
    return
  } 
  });
  }

  if (member.guild.id !== "560865387206672384") return;
  if (member.user.bot) member.roles.add(member.guild.roles.find(role => role.id === "568873150809636885"))
};
