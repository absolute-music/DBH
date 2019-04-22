const url = require("url");
const path = require("path");
const Discord = require("discord.js");
const express = require("express");
const app = express();
const moment = require("moment");
require("moment-duration-format");
const passport = require("passport");
const session = require("express-session");
const MemoryStore = require("memorystore")(session);
const Strategy = require("passport-discord").Strategy;
const helmet = require("helmet");
const md = require("marked");
const validUrl = require("valid-url");
const Profiles = require("../models/profile");
const Bots = require("../models/bots");
const config = require("../config");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

mongoose.connect(config.dbUrl, { useNewUrlParser: true });

// const nB = new Bots({
//   id: "560869129310175243",
//   mainOwner: "414764511489294347",
//   owners: [],
//   library: "discord.js",
//   upvotes: 0,
//   totalVotes: 0,
//   website: "https://bots.discordhouse.xyz",
//   votes: [],
//   github: null,
//   shortDesc: "This is a short desc.",
//   longDesc: "<p>Fk you lol</p>",
//   server: "https://discord.gg/discordhouse",
//   prefix: ">",
//   verified: false,
//   trusted: true,
//   certified: false,
//   vanityUrl: null,
//   invite: null,
//   featured: null,
//   tags: ["Role Management"],
//   token: "test",
//   shardID: 0,
//   serverCount: 0,
//   shardCount: 0
// });

// nB.save();
module.exports = (client) => {
  const dataDir = path.resolve(`${process.cwd()}${path.sep}dashboard`);
  const templateDir = path.resolve(`${dataDir}${path.sep}templates`);
  app.use("/public", express.static(path.resolve(`${dataDir}${path.sep}public`)));

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  const validateBotForID = async (id) => {
    try {
      const bot = await client.users.fetch(id);
      if (bot.bot) {
        return true
      } else {
        return false;
      };
    } catch (e) {
      return false;
    }
  };

  const getClientIp = (req) => {
    var ipAddress = req.connection.remoteAddress;
    if (!ipAddress) {
      return '';
    }

    if (ipAddress.substr(0, 7) == "::ffff:") {
      ipAddress = ipAddress.substr(7)
    }

    return ipAddress;
  };

  const fetchInviteURL = async (invite) => {
    try {
      const inv = await client.fetchInvite(invite);
      return { valid: true, temporary: false };
    } catch (e) {
      return { valid: false, temporary: null };
    }
  };

  const renderTemplate = (res, req, template, data = {}) => {
    const baseData = {
      bot: client,
      path: req.path,
      user: req.isAuthenticated() ? req.user : null
    };
    res.render(path.resolve(`${templateDir}${path.sep}${template}`), Object.assign(baseData, data));
  };

  passport.use(new Strategy({
    clientID: client.user.id,
    clientSecret: client.config.dashboard.oauthSecret,
    callbackURL: client.config.dashboard.callbackURL,
    scope: ["identify", "email"]
  },
  (accessToken, refreshToken, profile, done) => {
    process.nextTick(() => done(null, profile));
  }))

  app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: client.config.dashboard.sessionSecret,
    resave: false,
    saveUninitialized: false,
  }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 75
  });

  app.use(limiter);
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(helmet());

  app.locals.domain = client.config.dashboard.domain;
  app.engine("html", require("ejs").renderFile);
  app.set("view engine", "html");
  var bodyParser = require("body-parser");
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  function checkAuth (req, res, next) {
    if (req.isAuthenticated()) return next();
    req.session.backURL = req.url;
    res.redirect("/login");
  }

  app.get("/discord", (req, res) => res.redirect("https://discord.gg/E2Ker3E"));

  app.get("/login", (req, res, next) => {
    if (req.session.backURL) {
      req.session.backURL = req.session.backURL; // eslint-disable-line no-self-assign
    } else if (req.headers.referer) {
      const parsed = url.parse(req.headers.referer);
      if (parsed.hostname === app.locals.domain) {
        req.session.backURL = parsed.path;
      }
    } else {
      req.session.backURL = "/";
    }
    next();
  },
  passport.authenticate("discord"));

  app.get("/callback", passport.authenticate("discord", { failureRedirect: "/forbidden" }), async (req, res) => {
    session.us = req.user;
    let userdata = await Profiles.findOne({ id: req.user.id });
    if (!userdata) {
      const usr = new Profiles({
        id: req.user.id,
        bio: "I'm a very mysterious person.",
        certifiedDev: false,
        bg: null,
        mod: false,
        admin: false,
        email: req.user.email
      });
      await usr.save().catch(e => console.log(e));
      userdata = { id: req.user.id, bio: "I'm a very mysterious person.", certifiedDev: false, bg: null, mod: false, admin: false };

      if (userdata.mod === true) req.session.permLevel = 1;
      if (userdata.admin === true) req.session.permLevel = 2;
      if (!req.session.permLevel) req.session.permLevel = 0;

      if (userdata !== req.user.email) {
        Profiles.findOne({ id: req.user.id }, async (err, res) => {
          if (err) console.log(err);
          res.email = req.user.email;
          await res.save().catch(e => console.log(e));
        });
      }
    }

    if (userdata.mod === true) {
      req.session.isMod = true;
    } else {
      req.session.isMod = false;
    }

    if (userdata.admin === true) {
      req.session.isAdmin = true;
    } else {
      req.session.isAdmin = false;
    }

    if (req.session.backURL) {
      const url = req.session.backURL;
      req.session.backURL = null;
      res.redirect(url);
    } else {
      res.redirect("/");
    }
  });

  app.get("/logout", function (req, res) {
    req.session.destroy(() => {
      req.logout();
      res.redirect("/");
    });
  });

  app.get("/", async (req, res) => {
    let results = await Bots.find({ featured: true, approved: true  });
    let newbot = await Bots.find({ approved: true }).sort({ "_id": -1 });
    renderTemplate(res, req, "index.ejs", { featuredBots: results.splice(0, 4) ,newbots: newbot });
  });

  app.get("/api/bot/:id", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    const data = await Bots.findOne({ id: req.params.id, approved: true });;
    if (!data) return res.status(404).send(JSON.stringify({ "msg": "Not Found.", "code": 404 }, null, 4));
    const obj = {
      "msg": "Sucessfull request.",
      "code": 200,
      "id": data.id,
      "owner": data.mainOwner,
      "owners": data.owners,
      "library": data.library,
      "monthlyUpvotes": data.upvotes,
      "allTimeUpvotes": data.totalVotes,
      "website": data.website,
      "votes": data.votes,
      "githubUrl": data.github,
      "supportServerInvite": data.server,
      "prefix": data.prefix,
      "verified": data.verified,
      "trusted": data.trusted,
      "vanityUrl": data.vanityUrl,
      "stats": data.stats,
      "inviteUrl": data.invite,
      "tags": data.tags,
      "shardID": data.shardID,
      "serverCount": data.serverCount,
      "shardCount": data.shardCount
    };
    return res.status(200).send(JSON.stringify(obj, null, 4));
  });

  app.get("/api/profiles/:id", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    const data = await Profiles.findOne({ id: req.params.id, });
    if (!data) return res.status(404).send(JSON.stringify({ "msg": "Not Found.", "code": 404 }, null, 4));
    const obj = {
      "msg": "Sucessfull request.",
      "code": 200,
      "id": data.id,
      "bio": data.bio,
      "certifiedDev": data.certifiedDev,
      "customBackground": data.bg,
      "mod": data.mod,
      "admin": data.admin
    };
    return res.status(200).send(JSON.stringify(obj, null, 4));
  });

  app.post("/api/stats/bot/:id", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    if (!req.body) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No body was found within the request.", "errorCode": "NO_STATS_POST_BODY" }, null, 4));
    if (!req.body.serverCount) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No serverCount key was found within the request body.", "errorCode": "NO_STATS_POST_SERVERCOUNT" }, null, 4));
    if (!req.body.authorization) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No authorization key was found within the request body.", "errorCode": "NO_STATS_POST_AUTHORIZATION" }, null, 4));
    if (isNaN(parseInt(req.body.serverCount))) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "serverCount must be a number.", "errorCode": "STATS_POST_INVALID_SERVERCOUNT" }, null, 4));
    if (typeof req.body.authorization !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "authorization must be a string.", "errorCode": "STATS_POST_INVALID_AUTHORIZATION" }, null, 4));
    if (req.body.shardCount && isNaN(parseInt(req.body.shardCount))) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "shardCount must be a number.", "errorCode": "STATS_POST_INVALID_SHARDCOUNT" }, null, 4));
    Bots.findOne({ id: req.params.id, approved: true }, async (err, itself) => {
      if (err) console.log(err);
      if (!itself) return res.status(404).send(JSON.stringify({ "msg": "Not Found.", "code": 404 }, null, 4));
      if (req.body.authorization !== itself.token) return res.status(401).send(JSON.stringify({ "msg": "Unauthorized.", "code": 401, "error": "Invalid authorization token was provided for this bot." }, null, 4));
      itself.serverCount = parseInt(req.body.serverCount);
      if (req.body.shardCount) itself.shardCount = parseInt(req.body.shardCount);
      await itself.save().catch(e => console.log(e));
      res.status(200).send(JSON.stringify({ "msg": "Sucessfull request.", "code": 200 }, null, 4));
    });
  });

  app.get("/profile/:userID", checkAuth, async (req, res) => {
    const discordUser = client.users.get(req.params.userID);
    if (!discordUser) return res.redirect("/");
    const bots = await Bots.find({ mainOwner: discordUser.id, approved: true });
    var userData = await Profiles.findOne({ id: discordUser.id });
    if (!userData) userData = { bg: null, bio: "I'm a very misteryious person.", certifiedDev: null, mod: null, admin: null };
    renderTemplate(res, req, "/profile.ejs", { profile: userData, bots, discordUser });
  });

  app.get("/contact", checkAuth, (req, res) => {
    renderTemplate(res, req, "contact.ejs");
  });

  app.post("/contact", checkAuth, async (req, res) => {
    if (!req.body.message) return res.redirect("/contact");

    const embed = new Discord.MessageEmbed()
      .setAuthor("Contact Form", req.user.avatarURL)
      .setDescription(req.body.message)
      .addField("Submitted by:",`${req.user.username}#${req.user.discriminator} (ID: ${req.user.id})`)
      .addField("Internet Protocol:", `${getClientIp(req)}`)
      .addField("E-mail:", `${req.user.email}`)
      .setColor("BLUE")
      .setTimestamp();

    client.channels.get("569068982947151876").send(embed);
    res.redirect("/");
  });

  app.get("/top", async (req, res) => {
    const query = new RegExp("u", "i")
    let results = await Bots.find({ name: query }).sort([["upvotes", "descending"]]);
    renderTemplate(res, req, "top.ejs", { featuredBots: results });
  });

  app.get("/new", async (req, res) => {
    const query = new RegExp("u", "i")
    let results = await Bots.find({ name: query }).sort( {'_id': -1} );
    renderTemplate(res, req, "new.ejs", { featuredBots: results });
  });

  app.get("/tags/:tagname", async (req, res) => {
    let results = await Bots.find({ tags: req.params.tagname }).sort([["upvotes", "descending"]]);
    renderTemplate(res, req, "tags.ejs", { tag:req.params.tagname ,featuredBots: results });
  });

  app.get("/certified", async (req, res) => {
    const query = new RegExp("u", "i")
    let results = await Bots.find({ name: query ,certified:true }).sort([["upvotes", "descending"]]);
    renderTemplate(res, req, "certified.ejs", { featuredBots: results });
  });
  app.get("/add", checkAuth, (req, res) => {
    renderTemplate(res, req, "addbot.ejs", { sucess: null, fail: null });
  });

  app.get("/bot/:id", async (req, res) => {
    var Botsdata = await Bots.findOne({ vanityUrl: req.params.id });
    if (!Botsdata) Botsdata = await Bots.findOne({ id: req.params.id });
    if (!Botsdata) return res.redirect("/");
    renderTemplate(res, req, "botpage.ejs", { thebot: Botsdata });
  });

  app.get("/bot/:id/delete", checkAuth, async (req, res) => {
    var Bot = await Bots.findOne({ vanityUrl: req.params.id });
    if (!Bot) Bot = await Bots.findOne({ id: req.params.id });
    if (!Bot) return res.redirect("/");
    if (req.user.id !== Bot.mainOwner && req.session.permLevel < 1) return res.redirect("/");
    renderTemplate(res, req, "bot/delete.ejs", { theBot: Bot });
  });

  app.post("/bot/:id/delete", checkAuth, async (req, res) => {
    const name = req.body.name || "";
    const conset = req.name.conset || "no";
    var Bot = await Bots.findOne({ vanityUrl: req.params.id });
    if (!Bot) Bot = await Bots.findOne({ id: req.params.id });
    if (!Bot) return res.redirect("/");
    if (req.user.id !== Bot.mainOwner && req.session.permLevel < 1) return res.redirect("/");
    if (name !== Bot.name) return res.redirect("/");
    if (conset !== "on") return res.redirect("/");
    if (Bot.vanityUrl === req.params.id) {
      await Bots.findOneAndDelete({ vanityUrl: req.params.id }).catch(e => console.log(e));
    } else {
      await Bots.findOneAndDelete({ id: req.params.id }).catch(e => console.log(e));
    }
    return res.redirect("/");
  });

  app.get("/bot/:id/edit", checkAuth, async (req, res) => {
    var Bot = await Bots.findOne({ vanityUrl: req.params.id });
    if (!Bot) Bot = await Bots.findOne({ id: req.params.id });
    if (!Bot) return res.redirect("/");
    if (req.user.id !== Bot.mainOwner && req.session.permLevel < 1 || !Bot.owners.includes(req.user.id) && req.session.permLevel < 1) return res.redirect("/");
    renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: null });
  });

  app.post("/bot/:id/edit", checkAuth, async (req, res) => {
    var Bot = await Bots.findOne({ vanityUrl: req.params.id });
    if (!Bot) Bot = await Bots.findOne({ id: req.params.id });
    if (!Bot) return res.redirect("/");
    if (req.user.id !== Bot.mainOwner && req.session.permLevel < 1 || !Bot.owners.includes(req.user.id) && req.session.permLevel < 1) return res.redirect("/");

    const bodyData = {
      clientID: req.body.clientID,
      library: req.body.library,
      prefix: req.body.prefix,
      shortDesc: req.body.shortDesc,
      longDesc: req.body.longdesc,
      supportServer: `https://discord.gg/${req.body.supportServer}`,
      tags: req.body.tags,
      supportServerCode: req.body.supportServer,
      otherOwners: req.body.otherOwners,
      inviteURL: req.body.inviteURL,
      github: req.body.github,
      website: req.body.website
    }

    const validBot = await validateBotForID(bodyData.clientID);
    if (validBot === false) return renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: "Invalid ClientID/provided ClientID was not a bot." });
    if (bodyData.shortDesc.length < 40) return renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: "Short description must be at least 40 characters long." });
    if (bodyData.shortDesc.length > 100) return renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: "Short description can be maximum 100 characters long." });
    if (bodyData.longDesc.length < 250) return renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: "Long description must be at last 250 characters long." });
    const invDetails = await fetchInviteURL(bodyData.supportServer);
    if (invDetails.valid === false) return renderTemplate(res, req, "bot/edit.ejs", { theBot: Bot, sucess: null, fail: "Invite code provided is invalid." });

    let self = await client.users.fetch(bodyData.clientID);

    if (Bot.vanityUrl === req.params.id) {
      Bots.findOne({ vanityUrl: req.params.id }, async (err, entry) => {
        entry.name = self.username;
        entry.owners = bodyData.otherOwners.split(", ")[0] !== "" ? bodyData.otherOwners.split(", ") : [];
        entry.library = bodyData.library;
        entry.website = bodyData.website || "none";
        entry.github = bodyData.github || "none";
        entry.shortDesc = bodyData.shortDesc;
        entry.longDesc = bodyData.longDesc;
        entry.server = bodyData.supportServer;
        entry.prefix = bodyData.prefix;
        entry.invite =  bodyData.inviteURL.indexOf("https://discordapp.com/api/oauth2/authorize") !== 0 ? `https://discordapp.com/api/oauth2/authorize?client_id=${bodyData.clientID}&permissions=0&scope=bot` : bodyData.inviteURL;
        entry.tags = bodyData.tags;

        await entry.save().catch(e => console.log(e));
      });
    } else  {
      Bots.findOne({ vanityUrl: req.params.id }, async (err, entry) => {
        entry.name = self.username;
        entry.owners = bodyData.otherOwners.split(", ")[0] !== "" ? bodyData.otherOwners.split(", ") : [];
        entry.library = bodyData.library;
        entry.website = bodyData.website || "none";
        entry.github = bodyData.github || "none";
        entry.shortDesc = bodyData.shortDesc;
        entry.longDesc = bodyData.longDesc;
        entry.server = bodyData.supportServer;
        entry.prefix = bodyData.prefix;
        entry.invite =  bodyData.inviteURL.indexOf("https://discordapp.com/api/oauth2/authorize") !== 0 ? `https://discordapp.com/api/oauth2/authorize?client_id=${bodyData.clientID}&permissions=0&scope=bot` : bodyData.inviteURL;
        entry.tags = bodyData.tags;

        await entry.save().catch(e => console.log(e));
      });
    }

    client.channels.get("561622522798407740").send(`🖋 <@${req.user.id}> edited <@${Bot.id}>.\nURL: https://discordhouse.org/bot/${Bot.id}`);
    res.redirect("/bot/" + Bot.id);
  });

  app.get("/bot/:botID/vote", async (req, res) => {
    const thebot = client.users.get(req.params.botID);
    if (!thebot) return res.redirect("/");
    const Botsdata = await Bots.findOne({ id: thebot.id });
    thebot.data = Botsdata;
    renderTemplate(res, req, "vote.ejs", { thebot });
  });
  app.get("/api/search", async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (!req.query.name) return res.send(JSON.stringify({ "msg": "Bad request.", "code": 400 }, null, 4));
    const query = new RegExp(req.query.name, "i")
    let results = await Bots.find({ name: query });
    if (results.length < 1) return res.send(JSON.stringify({ "msg": "Not found.", "code": 404 }, null, 4));
    res.send(JSON.stringify({ "msg": "Sucessfull request.", "code": 200, "results": results, "bot": client }, null, 4));
  });

  app.post("/add", checkAuth, async (req, res) => {
    const bodyData = {
      clientID: req.body.clientID,
      library: req.body.library,
      prefix: req.body.prefix,
      shortDesc: req.body.shortDesc,
      longDesc: req.body.longdesc,
      supportServer: `https://discord.gg/${req.body.supportServer}`,
      tags: req.body.tags,
      supportServerCode: req.body.supportServer,
      otherOwners: req.body.otherOwners,
      inviteURL: req.body.inviteURL,
      github: req.body.github,
      website: req.body.website
    }

    const validBot = await validateBotForID(bodyData.clientID);
    if (validBot === false) return renderTemplate(res, req, "addbot.ejs", { sucess: null, fail: "Invalid ClientID/provided ClientID was not a bot." });
    if (bodyData.longDesc.length < 250) return renderTemplate(res, req, "addbot.ejs", { sucess: null, fail: "Long description must be at last 250 characters long." });
    const invDetails = await fetchInviteURL(bodyData.supportServer);
    if (invDetails.valid === false) return renderTemplate(res, req, "addbot.ejs", { sucess: null, fail: "Invite code provided is invalid." });

    const isBot = await Bots.findOne({ id: bodyData.clientID });
    if (isBot) return renderTemplate(res, req, "addbot.ejs", { sucess: null, fail: "This bot is already on list or approving queue." });

    let self = await client.users.fetch(bodyData.clientID);

    const newBot = new Bots({
      id: bodyData.clientID,
      mainOwner: req.user.id,
      name: self.username,
      owners: bodyData.otherOwners.split(", ")[0] !== "" ? bodyData.otherOwners.split(", ") : [],
      library: bodyData.library,
      upvotes: 0,
      totalVotes: 0,
      website: bodyData.website || "none",
      votes: [],
      github: bodyData.github || "none",
      shortDesc: bodyData.shortDesc,
      longDesc: bodyData.longDesc,
      server: bodyData.supportServer,
      prefix: bodyData.prefix,
      verified: false,
      trusted: false,
      certified: false,
      vanityUrl: null,
      invite: bodyData.inviteURL.indexOf("https://discordapp.com/api/oauth2/authorize") !== 0 ? `https://discordapp.com/api/oauth2/authorize?client_id=${bodyData.clientID}&permissions=0&scope=bot` : bodyData.inviteURL,
      featured: null,
      tags: bodyData.tags,
      token: null,
      shardID: 0,
      serverCount: 0,
      shardCount: 0,
      approved: false
    });

    newBot.save().catch(e => console.log(e));
    client.channels.get("561622522798407740").send(`📥 <@${req.user.id}> just submitted <@${bodyData.clientID}>.`);
    const addEmbed = new Discord.MessageEmbed()
      .setTitle(`${req.user.username}#${req.user.discriminator} submitted a bot.`)
      .addField("Client ID:", `${bodyData.clientID}`)
      .addField("Owner:", `${req.user.id}`)
      .addField("Prefix:", `\`|${bodyData.prefix}|\``)
      .setDescription(`${bodyData.shortDesc}`)
      .addField("Tags:", `${bodyData.tags.join(", ")}`)
      .addField("Library:", `${bodyData.library}`)
      .addField("Website:", `${bodyData.website.length < 1 ? "No Website" : bodyData.website}`)
      .addField("GitHub:", `${bodyData.github.length < 1 ? "No GitHub" : bodyData.github}`)
      .addField("Support Server:", `${bodyData.supportServer}`)
      .addField("Other Owners:", `${bodyData.otherOwners.split(", ")[0] !== "" ? bodyData.otherOwners.split(", ").join(", ") : "No Other Owners"}`)
      .addField("InviteURL:", `${bodyData.inviteURL.indexOf("https://discordapp.com/api/oauth2/authorize") !== 0 ? "No Url" : `Custom Url: ${bodyData.inviteURL}\n`}Pre-Made URL: ${`https://discordapp.com/api/oauth2/authorize?client_id=${bodyData.clientID}&permissions=0&scope=bot`}`)
      .setColor("BLUE")
      .setTimestamp();
    client.channels.get("561622527919783938").send(bodyData.clientID, addEmbed);
    renderTemplate(res, req, "addbot.ejs", { sucess: "Bot has been successfully added on approving queue.", fail: null });
  });

  app.get("/privacy", (req, res) => {
    renderTemplate(res, req, "privacy.ejs");
  });

  app.get("/terms", (req, res) => {
    renderTemplate(res, req, "terms.ejs");
  });

  app.get("/license", (req, res) => {
    renderTemplate(res, req, "license.ejs");
  });

  app.get("/api/docs", (req, res) => {
    renderTemplate(res, req, "api.ejs");
  });


  app.get("*", (req, res) => renderTemplate(res, req, "404.ejs"));
  app.post("*", (req, res) => renderTemplate(res, req, "404.ejs"));

  client.site = app.listen(client.config.dashboard.port, null, null, () => console.log("Dashboard is up and running."));
};
