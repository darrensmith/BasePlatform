var passport = require("passport");
var fs = require('fs');
var extract = require('extract-zip');

/**
 * Operations on /applications
 */
module.exports = {
    
    /**
     * Get list of applications

     * parameters: 
     * produces: 
     */
    get: [ 
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            console.log(app.locals.settings.Applications);
            var output = app.locals.settings.Applications;
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
                    var application = app.locals.settings.Applications[oldAppId];

                    // Create deployment record
                    application.Deployments[app.locals.settings.Applications[(oldAppId)].latestDeployId] = {
                        deployId: app.locals.settings.Applications[oldAppId].latestDeployId,
                        gitRepository: '',
                        zipLocation: '',
                        zipUploaded: zipUploaded
                    }

                    // Extract ZIP file to the deployment folder (for this app-deployment and clear the zip)
                    var latestDeployId = app.locals.settings.Applications[oldAppId].latestDeployId;
                    var dir = 'deployments/'+oldAppId+'-'+latestDeployId;
                    if (fs.existsSync(dir)){ rmDir(dir);}
                    fs.mkdirSync(dir);
                    extract(req.file.path, {dir: dir}, function (err) {
                        console.log('file unzipped');
                        fs.unlinkSync(req.file.path);

                        // Execute npm start in process folder
                        const fork = require('child_process').fork;
                        app.locals.settings.deployedProcesses[oldAppId+'-'+latestDeployId] = fork('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js');

                        // Increase deploy ID
                        app.locals.settings.Applications[oldAppId].latestDeployId++;

                        var output = {
                            id: (app.locals.settings.latestAppId - 1),
                            type: '/applications',
                            action: 'Create',
                            result:'Success',
                            shortMessage: 'Application Created and Deployed',
                            longMessage: 'Application Created and Deployed Successfully'
                        }
                        res.send(output);

                    });
                } else {
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
