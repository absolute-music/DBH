const Discord = require("discord.js"); // eslint-disable-line no-unused-vars
const dashboard = require("../dashboard/index.js");

exports.run = async (client) => {
  /* */

setTimeout(async () => {
  const request = require("request");
  request.post(`http://localhost/api/stats/bot/${client.user.id}`, { form: { serverCount: 1243422, shardCount: 2222, authorization: "test" } }, (error, res, req) => { console.log(error); console.log(res.body); });
}, 10000);

/**/
  console.log(`${client.user.username} is ready.`);
  dashboard(client);
};