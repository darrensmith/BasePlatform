var passport = require("passport");
var fs = require('fs');
var extract = require('extract-zip');

/**
 * Operations on /applications
 */

// TODO: Move targetServer across to Deployment record

module.exports = {
    
    /**
     * Get list of applications

     * parameters: 
     * produces: 
     */
    get: [ 
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            var applications = app.locals.settings.Applications;
            var applicationList = [];
            for (var i = 0; i <= applications.length; i++) {
                if(applications[i]) {
                    applicationList.push({
                        appId: applications[i].appId,
                        title: applications[i].title,
                        description: applications[i].description,
                        appPath: applications[i].appPath,
                        targetServer: applications[i].targetServer,
                        route: applications[i].route
                    });
                }
            }
            var output = applicationList;
            res.send(output);
        }
    ],
    
    /**
     * Creates a new application

     * parameters: 
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var title = req.body.title;
            var description = req.body.description;
            var appPath = req.body.appPath;
            var targetServer = req.body.targetServer;
            var route = req.body.route;

            var appExists = false;

            if(app.locals.settings.proxyRoutes[route])
                appExists = true;

            if(!appExists){

                console.log('creating application...');

                app.locals.settings.Applications[app.locals.settings.latestAppId] = {
                    appId: app.locals.settings.latestAppId,
                    title: title,
                    description: description,
                    appPath: appPath,
                    targetServer: targetServer,
                    route: route
                }
                
                app.locals.settings.AppStatistics[app.locals.settings.latestAppId] = {
                    appId: app.locals.settings.latestAppId,
                    requestsToDate: 0,
                    dataInToDate: 0,
                    dataOutToDate: 0,
                    requestsToday: 0,
                    dataInToday: 0,
                    dataOutToday: 0,
                    responsesToDate: 0,
                    responsesToday: 0
                }
                
                app.locals.settings.proxyRoutes[route] = {
                    appId: app.locals.settings.latestAppId,
                    targetServer: targetServer
                }

                app.locals.settings.Applications[app.locals.settings.latestAppId].Deployments = [];

                app.locals.settings.Applications[app.locals.settings.latestAppId].latestDeployId = 1;

                app.locals.settings.latestAppId++;

                var oldAppId = app.locals.settings.latestAppId - 1;

                // Check that ZIP file was uploaded:
                var zipUploaded = true;
                if(req.file)
                    zipUploaded = true;
                else
                    zipUploaded = false;


                // Automatically deploy if zip uploaded
                if(zipUploaded){
                    console.log('ZIP detected. Deploying...');
                    var application = app.locals.settings.Applications[oldAppId];

                    // Create deployment record
                    application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId] = {
                        deployId: app.locals.settings.Applications[oldAppId].latestDeployId,
                        gitRepository: '',
                        zipLocation: '',
                        zipUploaded: zipUploaded,
                        status: 'Stopped'
                    }

                    // Extract ZIP file to the deployment folder (for this app-deployment and clear the zip)
                    if (!fs.existsSync('deployments')){ fs.mkdirSync('deployments'); } // Create deployments folder if it does not exist
                    var latestDeployId = app.locals.settings.Applications[oldAppId].latestDeployId;
                    application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId].status = "Extracting Application...";
                    var dir = 'deployments/'+oldAppId+'-'+latestDeployId;
                    if (fs.existsSync(dir)){ rmDir(dir);}
                    fs.mkdirSync(dir);

                    var outputSuccess = function(){
                        console.log('responding with success...');
                        fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                            if(err){console.log('Failed to update local applications state file');}
                        });

                        fs.writeFile('./config/saved-state/latestAppId.json',app.locals.settings.latestAppId,function(err){
                            if(err){console.log('Failed to update latest app id file');}
                        });

                        fs.writeFile('./config/saved-state/proxyRoutes.json',JSON.stringify(app.locals.settings.proxyRoutes),function(err){
                            if(err){console.log('Failed to update proxy routes file');}
                        });

                        var output = {
                            id: (app.locals.settings.latestAppId - 1),
                            type: '/applications',
                            action: 'Create',
                            result:'Success',
                            shortMessage: 'Application Created and Deployed',
                            longMessage: 'Application Created and Deployed Successfully'
                        }
                        res.send(output);
                    }

                    outputSuccess();

                    extract(req.file.path, {dir: dir}, function (err) {
                        application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId].status = "Installing Modules...";
                        fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                            if(err){console.log('Failed to update local applications state file');}
                        });
                        console.log('file unzipped');
                        fs.unlinkSync(req.file.path);

                        // Replace BASEPLATFORM_WEB_PORT with autocalculated value if present:
                        fs.readFile('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js','utf8', function (err, data) {
                          if (!err){
                            if(!req.body.targetServer || req.body.targetServer == ""){
                                console.log('Calculating port number...');
                                var index = data.indexOf('var BASEPLATFORM_WEB_PORT = ');
                                if(!index){
                                    console.log('Target Server Not Provided, No BasePlatform Web Port Area Defined');
                                }
                                var substring = data.substring((index),(index+40));
                                var portSplit = substring.split(";");
                                var portString = portSplit[0];
                                app.locals.settings.CurrentPortNumber++;
                                console.log('Writing new port number...');
                                data = data.replace(portString,"var BASEPLATFORM_WEB_PORT = "+app.locals.settings.CurrentPortNumber);
                                fs.writeFile('./config/saved-state/CurrentPortNumber.json',app.locals.settings.CurrentPortNumber,function(err){
                                    if(err){console.log('Failed to update local current port number state file');}
                                });
                                populateTargetServer(data);
                                fs.writeFile('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js',data,function(err){
                                    searchAndReplaceDBParameters(data);
                                    if(err){console.log('Failed to update BASEPLATFORM_WEB_PORT');}
                                });
                            } else {
                                searchAndReplaceDBParameters(data);
                            }
                          } else {
                            console.log('ERROR: server.js does not exist');
                          }
                        });

                        // TODO: Search server.js for DB parameters and replace with those from Platform Details if found
                        function searchAndReplaceDBParameters(data){

                            if(app.locals.settings.PlatformDetails){
                                console.log('Starting searchAndReplaceDBParameters');
                                for (var i = 0; i < app.locals.settings.PlatformDetails.length; i++) {
                                    if(app.locals.settings.PlatformDetails[i].parameter == "BASEPLATFORM_DB_HOST")
                                        var dbHost = app.locals.settings.PlatformDetails[i].value;
                                    if(app.locals.settings.PlatformDetails[i].parameter == "BASEPLATFORM_DB_PORT")
                                        var dbPort = app.locals.settings.PlatformDetails[i].value;
                                    if(app.locals.settings.PlatformDetails[i].parameter == "BASEPLATFORM_DB_USER")
                                        var dbUser = app.locals.settings.PlatformDetails[i].value;
                                    if(app.locals.settings.PlatformDetails[i].parameter == "BASEPLATFORM_DB_PASS")
                                        var dbPass = app.locals.settings.PlatformDetails[i].value;
                                }
                            }

                            if(dbHost && dbPort && dbUser && dbPass){
                                console.log('Updating parameters for searchAndReplaceDBParameters');
                                var dbHostIndex = data.indexOf('var BASEPLATFORM_DB_HOST = ');
                                if(dbHostIndex){
                                    console.log('updating with DB HOST');
                                    var dbHostSubstring = data.substring((dbHostIndex),(dbHostIndex+1000));
                                    var dbHostSplit = dbHostSubstring.split(";");
                                    var dbHostString = dbHostSplit[0];
                                    data = data.replace(dbHostString,"var BASEPLATFORM_DB_HOST = '"+dbHost+"'");
                                }

                                var dbPortIndex = data.indexOf('var BASEPLATFORM_DB_PORT = ');
                                if(dbPortIndex){
                                    console.log('updating with DB PORT');
                                    var dbPortSubstring = data.substring((dbPortIndex),(dbPortIndex+1000));
                                    var dbPortSplit = dbPortSubstring.split(";");
                                    var dbPortString = dbPortSplit[0];
                                    data = data.replace(dbPortString,"var BASEPLATFORM_DB_PORT = "+dbPort);
                                }

                                var dbUserIndex = data.indexOf('var BASEPLATFORM_DB_USER = ');
                                if(dbUserIndex){
                                    console.log('updating with DB USER');
                                    var dbUserSubstring = data.substring((dbUserIndex),(dbUserIndex+1000));
                                    var dbUserSplit = dbUserSubstring.split(";");
                                    var dbUserString = dbUserSplit[0];
                                    data = data.replace(dbUserString,"var BASEPLATFORM_DB_USER = '"+dbUser+"'");
                                }

                                var dbPassIndex = data.indexOf('var BASEPLATFORM_DB_PASS = ');
                                if(dbPassIndex){
                                    console.log('updating with DB PASS');
                                    var dbPassSubstring = data.substring((dbPassIndex),(dbPassIndex+1000));
                                    var dbPassSplit = dbPassSubstring.split(";");
                                    var dbPassString = dbPassSplit[0];
                                    data = data.replace(dbPassString,"var BASEPLATFORM_DB_PASS = '"+dbPass+"'");
                                }

                                fs.writeFile('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js',data,function(err){
                                    if(err){console.log('Failed to update BASEPLATFORM_DB_* parameters');}
                                });
                            }


                        }

                        // TODO: Populate targetServer if left empty
                        function populateTargetServer(data){
                            if(!req.body.targetServer || req.body.targetServer == ""){
                                console.log('Target Server Autopopulated.');
                                var index = data.indexOf('var BASEPLATFORM_WEB_PORT = ');
                                console.log('var index - '+index);
                                var substring = data.substring((index+28),(index+28+6));
                                var portSplit = substring.split(";");
                                var port = portSplit[0];
                                app.locals.settings.Applications[oldAppId].targetServer = 'http://localhost:'+port;
                                console.log('route - '+route);
                                console.log(app.locals.settings.proxyRoutes);
                                app.locals.settings.proxyRoutes[route].targetServer = 'http://localhost:'+port;
                                fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                                    if(err){console.log('Failed to update local applications state file');}
                                });

                                fs.writeFile('./config/saved-state/proxyRoutes.json',JSON.stringify(app.locals.settings.proxyRoutes),function(err){
                                    if(err){console.log('Failed to update proxy routes file');}
                                });
                            } else {
                                console.log('Target Server Provided, Not Autopopulated.');
                            }
                            return;
                        }

                        // Check internet function
                        function checkInternet(cb){
                            require('dns').lookup('google.com',function(err){
                                if (err && err.code == "ENOTFOUND"){
                                    cb(false);
                                } else {
                                    cb(true)
                                }
                            });
                            return;
                        }

                        function installModules(){
                            // TODO: NPM INSTALL
                            var timer = 0;
                            var outputMessages = [];
                            const spawn = require('child_process').spawn;
                            console.log('Installing node modules...');
                            var npmInstall = spawn('npm',['install'],{
                                cwd: './deployments/'+oldAppId+'-'+latestDeployId,
                                env: process.env
                            });

                            npmInstall.stdout.on('data', (data) => {
                                  var str = data.toString(), lines = str.split(/(\r?\n)/g);
                                  for (var i=0; i<lines.length; i++) {
                                    console.log('stdout:');
                                    console.log(lines[i]);
                                  }
                            });

                            npmInstall.stderr.on('data', (data) => {
                                  var str = data.toString(), lines = str.split(/(\r?\n)/g);
                                  for (var i=0; i<lines.length; i++) {
                                    console.log('stderr:');
                                    console.log(lines[i]);
                                  }
                            });

                            npmInstall.on('close', (code) => {
                                console.log('closed - '+code);
                            });

                            npmInstall.on('error', (err) => {
                                console.log('error - '+err);
                            });

                            npmInstall.on('exit', (code,signal) => {
                                console.log('exit - '+code+', signal - '+signal);
                                executeProcess();
                            });

                            npmInstall.on('disconnect', (code,signal) => {
                                console.log('disconnected');
                            });

                        }

                        // Check internet and if available install modules
                        checkInternet(function(isConnected){
                            if(isConnected){
                                installModules();
                            } else {
                                console.log('Not connected to internet. Bypassing module installation...');
                                application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId].status = "Stopped";
                                app.locals.settings.Applications[oldAppId].latestDeployId++;
                                fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                                    if(err){console.log('Failed to update local applications state file');}
                                });
                            }
                        });

                        // Executing node process:
                        var executeProcess = function(){
                            // Execute npm start in process folder
                            const fork = require('child_process').fork;
                            app.locals.settings.deployedProcesses[oldAppId+'-'+(app.locals.settings.Applications[oldAppId].latestDeployId)] = fork('server.js',[],{
                                cwd: './deployments/'+oldAppId+'-'+(app.locals.settings.Applications[oldAppId].latestDeployId),
                                env: process.env
                            });
                            application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId].status = "Running";
                            app.locals.settings.Applications[oldAppId].latestDeployId++;
                            fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                                if(err){console.log('Failed to update local applications state file');}
                            });
                        }

                    });
                } else {

                    fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                        if(err){console.log('Failed to update local applications state file');}
                    });

                    fs.writeFile('./config/saved-state/latestAppId.json',app.locals.settings.latestAppId,function(err){
                        if(err){console.log('Failed to update latest app id file');}
                    });

                    fs.writeFile('./config/saved-state/proxyRoutes.json',JSON.stringify(app.locals.settings.proxyRoutes),function(err){
                        if(err){console.log('Failed to update proxy routes file');}
                    });

                    var output = {
                        id: (app.locals.settings.latestAppId - 1),
                        type: '/applications',
                        action: 'Create',
                        result:'Success',
                        shortMessage: 'Application Created',
                        longMessage: 'Application Created Successfully'
                    }
                    res.send(output);
                }

            } else {
                var output = {
                    id: (app.locals.settings.latestAppId - 1),
                    type: '/applications',
                    action: 'Create',
                    result:'Error',
                    shortMessage: 'Application already exists',
                    longMessage: 'Application already exists'
                }
                res.send(output);
            }

 

        }
    ]
    
};

var rmDir = function(dirPath) {
      try { var files = fs.readdirSync(dirPath); }
      catch(e) { return; }
      if (files.length > 0)
        for (var i = 0; i < files.length; i++) {
          var filePath = dirPath + '/' + files[i];
          if (fs.statSync(filePath).isFile())
            fs.unlinkSync(filePath);
          else
            rmDir(filePath);
        }
      fs.rmdirSync(dirPath);
    };
