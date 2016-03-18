/*

  This server initialisation file has been customised so that Party can be deployed on to AWS Lambda
  and run as a serverless RESTful web service
  Following instructions here - http://sipsma.me/howto.html

  Simply:
  1. ZIP up all of these folders and files (ensuring that aws.js is at the root of the zip)
  2. Create a new Lambda application and upload the ZIP file
  3. Define the handler as being "aws.handler"
  4. You should now be able to submit events to productpipes in the format of:
      {
        "cookie": "",
        "method": "GET",
        "remoteAddress": "1.129.96.79",
        "resource": "/api/v1/",
      }

  5. Note: Expect a 401 Unauthorised response from the server. This shows it is working

  You will then need to setup:
  1. An API on Amazon API Gateway to point at the Lambda instance (manual setup is tedius. You may be able to
     import the Swagger definition file to create an API). Will still need some customisation
  2. A MySQL RDS instance that is referred to from the config or database.js file in /lib and has the database
     schema and tables already defined

*/


'use strict';

var connection = null;
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var swaggerize = require('swaggerize-express');
var path = require('path');
var passport = require('passport');
var database = require('./lib/database');
var session = require('express-session');
var flash = require('connect-flash');
var genuuid = require('uid2');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var CustomStrategy = require('passport-custom').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var app = express();

global.__base = __dirname + '/';

// Setup database connection and models
app.use(function (req, res, next) {
  database(req, function (err, db) {
    if (err) return res.send(500, "cannot connect to database");
    req.db = db;
    req.models = db.models;
    next();
  });
});

app.use(session({
  genid: function(req) {
    return genuuid(36) // use UUIDs for session IDs 
  },
  secret: 'keyboard cat'
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(flash());

// Setup Passport for Authentication
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(function(user, done) {done(null, user);});
passport.deserializeUser(function(user, done) {done(null, user);});
var passportStrategySetup = require('./lib/passportStrategySetup');
passport.use(new ClientPasswordStrategy({passReqToCallback:true},
	function(req, clientId, clientSecret, done){
		passportStrategySetup.ClientPasswordStrategy(req, clientId, clientSecret, done);
	})
);
passport.use(new BasicStrategy({passReqToCallback:true},
	function(req, userid, password, done){
		passportStrategySetup.ClientPasswordStrategy(req, userid, password, done);
	})
);
passport.use('check-admin-company', new CustomStrategy(
  function(req, callback){
    passportStrategySetup.CheckAdminCompanyStrategy(req, callback);
  })
);
passport.use(new BearerStrategy({passReqToCallback:true},
  function(req, token, done) {
    passportStrategySetup.BearerStrategy(req, token, done);
  })
);

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization');
    next();
});

// Setup Swagger and API endpoints
app.use(swaggerize({
    api: path.resolve('./config/swagger.yaml'),
    handlers: path.resolve('./handlers')
}));

// Setup static HTML
app.use(express.static(path.join(__dirname, 'public')));


var sockPath = '/tmp/local';
var server = http.createServer(app);
var serverReady = false;

server.listen(sockPath, function () {
  serverReady = true;
});

// AWS Lamdba Handler Code:
exports.handler = function(event, context) {
  var reqopts = {
    method: event.method,
    path: event.resource,
    headers: {
      'Accept': event.accept,
      'Cookie': event.cookie
    },
    socketPath: sockPath
  };
 
  var resbody = '';
 
  var sendReq = function() {
    var clientreq = http.request(reqopts, function(res) {
      res.on('data', function(chunk) {
        resbody += chunk.toString('utf8');
      });
      res.on('end', function() {
        context.succeed(resbody);
      });
    })
    .on('error', function(err) {
      context.fail(err);
    });
 
    clientreq.end();
  }
 
  if (!serverReady) {
    server.on('listening', sendReq);
  }
  else {
    sendReq();
  };
}
