const Discord = require("discord.js");

module.exports.run = async (client, message) => {
  const reply = (c) => message.channel.send(c);
  if (message.author.bot) return;
  if (message.channel.type !== "text") return;
  if (message.content.indexOf("-") !== 0) return;
  const args = message.content.slice(1).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const cmd = client.commands.get(command);
  if (!cmd) return;

  try {
    await cmd.run(client, message, args, reply);
  } catch (e) {
    return reply(`Can't run command because \`${e}\`.`);
  }
};
