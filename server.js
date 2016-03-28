var connection = null;
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var swaggerize = require('swaggerize-express');
var path = require('path');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var genuuid = require('uid2');
var ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy;
var CustomStrategy = require('passport-custom').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var httpProxy = require('http-proxy');
var multer = require('multer');
var fs = require('fs');
    app = express();

global.__base = __dirname + '/';

app.use(session({
  genid: function(req) {
    return genuuid(36) // use UUIDs for session IDs 
  },
  secret: 'keyboard cat'
}))
app.use(bodyParser.json());
app.use(multer({ dest: './uploads/'}).single('zip'));
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
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,DELETE');
    res.header('Access-Control-Allow-Headers', 'Authorization,Content-Type');
    next();
});

// If no applications are set attempt to read from local file
app.use(function(req, res, next) {
  if(app.locals.settings.PlatformDetails.length == 0){
    fs.readFile('./config/saved-state/platformDetails.json','utf8',function(err,data){
      if(!err && data){
        app.locals.settings.PlatformDetails = JSON.parse(data);
      }
    });
  }
  if(app.locals.settings.Applications.length == 0){
    console.log('Reading app file');
    fs.readFile('./config/saved-state/applications.json','utf8',function(err,data){
      if(err){
        console.log('Attempted to load applications from filesystem - No applications known');
        next();
      } else if (!err && data) {
        console.log('Updating app file');
        app.locals.settings.Applications = JSON.parse(data);
        fs.readFile('./config/saved-state/latestAppId.json','utf8',function(err,data){
          app.locals.settings.latestAppId = data;
          next();
        });
      } else {
        console.log('error reading file');
        next();
      }
    });
    fs.readFile('./config/saved-state/appStatistics.json','utf8',function(err,data){
      if(!err && data){
        app.locals.settings.AppStatistics = JSON.parse(data);
      }
    });
    fs.readFile('./config/saved-state/proxyRoutes.json','utf8',function(err,data){
      if(!err && data){
        app.locals.settings.proxyRoutes = JSON.parse(data);
      }
    });
    fs.readFile('./config/saved-state/CurrentPortNumber.json','utf8',function(err,data){
      if(!err && data){
        app.locals.settings.CurrentPortNumber = data;
      }
    });
  } else {
    next();
  }
});

// Setup Swagger and API endpoints
app.use(swaggerize({
    api: path.resolve('./config/swagger.yaml'),
    handlers: path.resolve('./handlers')
}));

// Setup static HTML
app.use(express.static(path.join(__dirname, 'public')));

var server = http.createServer(app);

server.listen(8180, function () {});

app.locals.settings.proxyRoutes = {};
app.locals.settings.Applications = [];
app.locals.settings.AppDeployments = [];
app.locals.settings.latestAppId = 1;
app.locals.settings.Machines = [];
app.locals.settings.latestMachineId = 1;
app.locals.settings.AppStatistics = [];
app.locals.settings.deployedProcesses = [];
app.locals.settings.PlatformDetails = [];
app.locals.settings.CurrentPortNumber = 8200;

// Start proxy listening on port x
var proxy = httpProxy.createProxyServer({});
var proxyServer = http.createServer(function(req,res){

  res.oldWriteHead = res.writeHead;
  res.writeHead = function(statusCode, headers) {
    var contentType = res.getHeader('content-type');
    res.setHeader('BasePlatformVersion', '1.0'); 
    res.oldWriteHead(statusCode, headers);
  }


  var host = req.headers.host;
  var hostParts = host.split(':');
  if(app.locals.settings.proxyRoutes[hostParts[0]]){
    var stats = app.locals.settings.AppStatistics[app.locals.settings.proxyRoutes[hostParts[0]].appId];
    req.appId = app.locals.settings.proxyRoutes[hostParts[0]].appId;
    targetServer = app.locals.settings.proxyRoutes[hostParts[0]].targetServer;
  } else {
    targetServer = 'http://localhost:8180';
  }

  if(stats){
    stats.requestsToDate++;
    stats.dataInToDate += (JSON.stringify(req.rawHeaders).replace(/[\[\]\,\"]/g,'').length / 1024);
    stats.requestsToday++;
    stats.dataInToday += (JSON.stringify(req.rawHeaders).replace(/[\[\]\,\"]/g,'').length / 1024);
  }

  proxy.web(req,res,{
    target: targetServer
  });   

  proxy.on('error', function (err, req, res) {
      res.end('Error: '+err);
  });

  proxy.on('end', function (req, res) {
    if(req.appId){
      var stats = app.locals.settings.AppStatistics[req.appId];
      if(stats){
        if(!isNaN(res['_headers']['content-length'])){
          stats.dataOutToDate += (res['_headers']['content-length'] / 1024);
          stats.dataOutToday += (res['_headers']['content-length'] / 1024);          
        }
        stats.responsesToDate++;
        stats.responsesToday++;
      }      
    }
  });


})

console.log('listening on port 8080');
proxyServer.listen(8080);