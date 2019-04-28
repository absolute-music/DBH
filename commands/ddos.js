const Discord = require("discord.js");
const request = require('request')
module.exports.run = async (client, message, args, reply) => {

 const error = `Provide the appropriate security profile
    \`1\` == essentially_off
    \`2\` == low
    \`3\` == medium
    \`4\` == high
    \`5\` == under_attack
    `
 if(!args) return reply(error);
 if(args[0] !== '1' && args[0] !== '2' && args[0] !== '3' && args[0] !== '4' && args[0] !== '5') return reply(error);
 let value
 if(args[0] == '1') value = "essentially_off"
 if(args[0] == '2') value = "low"
 if(args[0] == '3') value = "medium"
 if(args[0] == '4') value = "high"
 if(args[0] == '5') value = "under_attack"

 var headers = {
    'X-Auth-Email': 'augucoj@gmail.com',
    'X-Auth-Key': '7aa2267671bd91cbb7df04efe2401a6296bad',
    'Content-Type': 'application/json'
};

var dataString = `{"value":${value}}`;

var options = {
    url: 'https://api.cloudflare.com/client/v4/zones/023e105f4ecef8ad9ca31a8372d0c353/settings/security_level',
    method: 'PATCH',
    headers: headers,
    body: dataString
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
    if (error) console.log(error)
    message.channel.send(`set to \`${value}\``)

}

request(options, callback);



};

module.exports.help = {
  name: "ddos"
};
