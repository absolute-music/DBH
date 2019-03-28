const Discord = require("discord.js");
const client = new Discord.Client();
const fs = require("fs");
client.config = require("./config.js");
client.commands = new Discord.Collection();

fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
      let eventFunction = require(`./events/${file}`);
      console.log(`Event Loaded: ${file.split(".")[0]}`);
      let eventName = file.split(".")[0];
      client.on(eventName, (...args) => eventFunction.run(client, ...args));
    });
  });

fs.readdir("./commands/", (err, files) => {
    if(err) console.log(err);
    let jsfile = files.filter(f => f.split(".").pop() === "js")
    if(jsfile.length <= 0){
      console.log("No commands we're found!!!");
      return;
    }
  
    jsfile.forEach((f, i) => {
      let props = require(`./commands/${f}`);
      console.log(`Command Loaded: ${f.split(".")[0]}`);
      client.commands.set(props.help.name, props);
    });
});

client.login(client.config.token);