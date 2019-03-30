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
  
  app.get("/", (req, res) => {
    renderTemplate(res, req, "index.ejs");
  });

  app.get("/api/bots/:id", async (req, res) => {
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    res.setHeader("Content-Type", "application/json");
    const data = await Bots.findOne({ id: req.params.id });;
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
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    res.setHeader("Content-Type", "application/json");
    const data = await Profiles.findOne({ id: req.params.id });
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
    if (typeof req.params.id !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400 }, null, 4));
    if (!req.body) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No body was found within the request.", "errorCode": "NO_STATS_POST_BODY" }, null, 4));
    if (!req.body.serverCount) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No serverCount key was found within the request body.", "errorCode": "NO_STATS_POST_SERVERCOUNT" }, null, 4));
    if (!req.body.authorization) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "No authorization key was found within the request body.", "errorCode": "NO_STATS_POST_AUTHORIZATION" }, null, 4));
    if (isNaN(parseInt(req.body.serverCount))) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "serverCount must be a number.", "errorCode": "STATS_POST_INVALID_SERVERCOUNT" }, null, 4));
    if (typeof req.body.authorization !== "string") return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "authorization must be a string.", "errorCode": "STATS_POST_INVALID_AUTHORIZATION" }, null, 4));
    if (req.body.shardCount && isNaN(parseInt(req.body.shardCount))) return res.status(400).send(JSON.stringify({ "msg": "Bad Request.", "code": 400, "error": "shardCount must be a number.", "errorCode": "STATS_POST_INVALID_SHARDCOUNT" }, null, 4));
    Bots.findOne({ id: req.params.id }, async (err, itself) => {
      if (err) console.log(err);
      if (!itself) return res.status(404).send(JSON.stringify({ "msg": "Not Found.", "code": 404 }, null, 4));
      if (req.body.authorization !== itself.token) return res.status(401).send(JSON.stringify({ "msg": "Unauthorized.", "code": 401, "error": "Invalid authorization token was provided for this bot." }, null, 4));
      itself.serverCount = parseInt(req.body.serverCount);
      if (req.body.shardCount) itself.shardCount = parseInt(req.body.shardCount);
      await itself.save().catch(e => console.log(e));
      res.status(200).send(JSON.stringify({ "msg": "Sucessfull request.", "code": 200 }, null, 4));
    });
  });

  app.get("/contact", checkAuth, (req, res) => {
    renderTemplate(res, req, "contact.ejs");
  });
  
  app.post("/contact", checkAuth, async (req, res) => {
    // Handle Form Data
  });
  
  app.get("/new", (req, res) => {
    renderTemplate(res, req, "addbot.ejs");
  });
  
  app.post("/new", (req, res) => {
    console.log(req.body);
  });
  
  client.site = app.listen(client.config.dashboard.port, null, null, () => console.log("Dashboard is up and running."));
};
