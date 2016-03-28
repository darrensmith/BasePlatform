var passport = require("passport");
var fs = require('fs');
var extract = require('extract-zip');

/**
 * Operations on /applications/{appId}/deployments
 */
module.exports = {
    
    /**
     * Get list of deployments

     * parameters: 
     * produces: 
     */
    get: [ 
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var application = app.locals.settings.Applications[req.params.appId];

            if(!application){
                var output = [];
                res.send(output);
            }

            var deploymentList = [];

            for (var i = 0; i <= application.Deployments.length; i++) {
                if(application.Deployments[i]){
                    deploymentList.push({
                        deployId: application.Deployments[i].deployId,
                        gitRepository: application.Deployments[i].gitRepository,
                        zipLocation: application.Deployments[i].zipLocation,
                        zipUploaded: application.Deployments[i].zipUploaded,
                        status: application.Deployments[i].status
                    });
                }
            }

            res.send(deploymentList);
        }
    ],
    
    /**
     * Creates a new deployment

     * parameters: appId, gitRepository, zipLocation
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var application = app.locals.settings.Applications[req.params.appId];
            var oldAppId = req.params.appId;

            if(!application){
                var output = {
                    id: '',
                    type: '/applications/deployments',
                    action: 'Create',
                    result:'Error',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            }

            // Check that ZIP file was uploaded:
            var zipUploaded = true;
            console.log(req.file);
            if(req.file)
                zipUploaded = true;
            else
                zipUploaded = false;

            // Create deployment record
            application.Deployments[app.locals.settings.Applications[req.params.appId].latestDeployId] = {
                deployId: app.locals.settings.Applications[req.params.appId].latestDeployId,
                gitRepository: req.body.gitRepository,
                zipLocation: req.body.zipLocation,
                zipUploaded: zipUploaded,
                status: 'Stopped'
            }

            // Extract ZIP file to the deployment folder (for this app-deployment and clear the zip)
            if(zipUploaded){
                application.Deployments[app.locals.settings.Applications[req.params.appId].latestDeployId].status = "Extracting Application...";
                if (!fs.existsSync('deployments')){ fs.mkdirSync('deployments'); } // Create deployments folder if it does not exist
                var latestDeployId = app.locals.settings.Applications[req.params.appId].latestDeployId;
                var dir = 'deployments/'+req.params.appId+'-'+latestDeployId;
                if (fs.existsSync(dir)){ rmDir(dir);}
                fs.mkdirSync(dir);

                var outputSuccess = function(){

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
                        type: '/applications/deployments',
                        action: 'Create',
                        result:'Success',
                        shortMessage: 'Application Deployed',
                        longMessage: 'Application Deployed Successfully'
                    }
                    res.send(output);
                }

                outputSuccess();

                extract(req.file.path, {dir: dir}, function (err) {
                    application.Deployments[app.locals.settings.Applications[req.params.appId].latestDeployId].status = "Installing Modules...";
                    fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                        if(err){console.log('Failed to update local applications state file');}
                    });
                    console.log('file unzipped');
                    fs.unlinkSync(req.file.path);

                    // Replace BASEPLATFORM_WEB_PORT with autocalculated value if present:
                    fs.readFile('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js', function (err, data) {
                      if (!err){
                          if(data.indexOf('BASEPLATFORM_WEB_PORT') == 2){
                            var nth = 0;
                            data = data.replace(/BASEPLATFORM_WEB_PORT/g, function (match, i, original){
                                nth++;
                                app.locals.settings.CurrentPortNumber++;
                                fs.writeFile('./config/saved-state/CurrentPortNumber.json',app.locals.settings.CurrentPortNumber,function(err){
                                    if(err){console.log('Failed to update local current port number state file');}
                                });
                                return (nth === 2) ? app.locals.settings.CurrentPortNumber : match;
                            });
                            fs.writeFile('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js',data,function(err){
                                if(err){console.log('Failed to update BASEPLATFORM_WEB_PORT');}
                            });
                          }
                      }
                    });

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

                    // Install modules:
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

                    // Execute node process:
                    var executeProcess = function(){
                        // Execute npm start in process folder
                        const fork = require('child_process').fork;
                        app.locals.settings.deployedProcesses[oldAppId+'-'+(app.locals.settings.Applications[oldAppId].latestDeployId)] = fork('server.js',[],{
                            cwd: './deployments/'+oldAppId+'-'+(app.locals.settings.Applications[oldAppId].latestDeployId),
                            env: process.env
                        });
                        application.Deployments[app.locals.settings.Applications[req.params.appId].latestDeployId].status = "Running";
                        fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                            if(err){console.log('Failed to update local applications state file');}
                        });
                        app.locals.settings.Applications[oldAppId].latestDeployId++;
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

                app.locals.settings.Applications[oldAppId].latestDeployId++;
                var output = {
                    id: (app.locals.settings.latestAppId - 1),
                    type: '/applications/deployments',
                    action: 'Create',
                    result:'Success',
                    shortMessage: 'Deployment Created',
                    longMessage: 'Deployment Created Successfully'
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
