/**
 * Module dependencies.
 */

// pull in the package json
var pjson = require("./package.json");
console.log("DDIM version: " + pjson.version);

// REQUIRE SECTION
var express = require("express"),
  config = require("config"),
  app = express(),
  passport = require("passport"),
  routes = require("./app/routes"),
  logger = require("morgan"),
  cookieParser = require("cookie-parser"),
  methodOverride = require("method-override"),
  bodyParser = require("body-parser"),
  flash = require("connect-flash"),
  session = require("express-session"),
  // favicon = require('serve-favicon'),
  compress = require("compression"),
  // multer = require('multer'),
  errors = require("./lib/errors"),
  crashProtector = require("common-errors").middleware.crashProtector,
  helpers = require("view-helpers"),
  lingua = require("lingua"),
  kue = require("kue"),
  url = require("url"),
  // MongoStore = require('connect-mongo'),
  MongoStore = require("connect-mongo");

const passportCfg =  require("./lib/passport.js")
const boot = require("./lib/boot")

// set version
app.set("version", pjson.version);

// port
var port = process.env.PORT || 8778;

function afterResourceFilesLoad() {
  console.log("configuring application, please wait...");

  app.set("showStackError", true);

  console.log("Enabling crash protector...");
  app.use(crashProtector());

  console.log("Enabling error handling...");
  app.use(errors.init());

  // make everything in the public folder publicly accessible - do this high up as possible
  app.use(express.static(__dirname + "/public"));

  // set compression on responses
  app.use(
    compress({
      filter: function (req, res) {
        return /json|text|javascript|css/.test(res.getHeader("Content-Type"));
      },
      level: 9,
    })
  );

  app.locals.layout = false;

  app.set("views", __dirname + "/app/views");
  app.set("view engine", "jade");

  // Lingua configuration
  console.log("Configuring language resources...");
  app.use(
    lingua(app, {
      defaultLocale: "en",
      path: __dirname + "/config/i18n",
    })
  );

  // set logging level - dev for now, later change for production
  app.use(logger("dev"));

  // expose package.json to views
  // app.use(function (req, res, next) {
  //   res.locals.pkg = pjson;
  //   res.locals.facility = {
  //     name: 'New Ikeja Hospital',
  //     address: 'Gbajobi Ikeja',
  //     phone_number: '08126488955'
  //   };
  //   next();
  // });

  // signed cookies
  app.use(cookieParser(config.express.secret));

  app.use(
    bodyParser.urlencoded({
      extended: true,
    })
  );
  app.use(bodyParser.json());

  app.use(methodOverride());

  // setup session management
  console.log("setting up session management, please wait...");
  app.use(
    session({
      resave: true,
      saveUninitialized: true,
      secret: config.express.secret,
      store: MongoStore.create({
        // db: config.db.database,
        // host: config.db.server,
        // port: config.db.port,
        // autoReconnect: true,
        // username: config.db.user,
        // password: config.db.password,
        // collection: "mongoStoreSessions",
        url: config.db.mongoUrl,
        mongoUrl: config.db.mongoUrl,
      }),
    })
  );

  passportCfg(passport);

  //Initialize Passport
  app.use(passport.initialize());

  //enable passport sessions
  app.use(passport.session());

  // connect flash for flash messages - should be declared after sessions
  app.use(flash());

  // should be declared after session and flash
  app.use(helpers(pjson.name));

  //pass in the app config params in to locals
  app.use(function (req, res, next) {
    res.locals.app = config.app;
    next();
  });

  var REDIS = url.parse(process.env.REDIS_URL || "redis://127.0.0.1:6379"),
    con_opts = {};

  con_opts.port = REDIS.port;
  con_opts.host = REDIS.hostname;

  if (REDIS.auth) {
    var REDIS_AUTH = REDIS.auth.split(":");
    con_opts.auth = REDIS_AUTH[1];
  }

  //job queue instance
  var jobQueue = kue.createQueue({ redis: con_opts });
  // our routes
  console.log("setting up routes, please wait...");
  routes(app, jobQueue);

  // assume "not found" in the error msgs
  // is a 404. this is somewhat silly, but
  // valid, you can do whatever you like, set
  // properties, use instanceof etc.
  app.use(function (err, req, res, next) {
    // treat as 404
    if (
      err.message &&
      (~err.message.indexOf("not found") ||
        ~err.message.indexOf("Cast to ObjectId failed"))
    ) {
      return next();
    }

    // log it
    // send emails if you want
    console.error(err.stack);

    // error page
    //res.status(500).json({ error: err.stack });
    //res.json(500, err.message);
    if (err.code) {
      res.status(400).json({
        url: req.originalUrl,
        error: err.name,
        code: err.code,
      });
    } else {
      res.status(500).json({
        url: req.originalUrl,
        error: err.message,
        stack: err.stack,
      });
    }
  });

  // assume 404 since no middleware responded
  app.use(function (req, res) {
    if (req.xhr) {
      res.status(404).json({ message: "resource not found" });
    } else {
      res.status(404).json({
        url: req.originalUrl,
        error: "Not found",
      });
    }
  });

  // development env config
  if (process.env.NODE_ENV == "development") {
    app.locals.pretty = true;
  }
}

console.log("Running Environment: %s", process.env.NODE_ENV);

/*ElasticSearch Connection*/
// console.log("Checking connection to ElasticSearch Server...");
// var esurl = process.env.ES_SSL_URL || process.env.ES_URL;
// restler.get(esurl)
// .on('success', function (data) {
//   if (data.status === 200) {
//     if (process.env.NODE_ENV !== 'production') {
//       console.log('ES running on ' + process.env.ES_URL);
//     }
//   }
// })
// .on('error', function (data) {
//   if (process.env.NODE_ENV !== 'production') {
//     console.log('Error Connecting to ES on ' + process.env.ES_URL);
//   } else {
//     console.log('Error Connecting to ES');
//   }
// });

/*MongoDB Connection*/
console.log("Setting up database communication...");
// setup database connection
require("./lib/db")
  .open()
  .then(function (mongoose) {
    console.log("Database Connection open...");
    require("mongoose-pureautoinc").init(mongoose);

    afterResourceFilesLoad();

    //load resource
    boot()
    // actual application start
    app.listen(port);
    console.log("DrugStoc Desktop Inventory Manager started on port " + port);
    // CATASTROPHIC ERROR
    app.use(function (err, req, res) {
      console.error(err.stack);

      // make this a nicer error later
      res
        .status(500)
        .send("Ewww! Something got broken on DDIM. Getting some tape and glue");
    });
  })
  .catch(function (e) {
    console.log(e.stack);
    console.log(e);
  });
