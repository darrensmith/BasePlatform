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

            var output = application.Deployments;
            res.send(output);
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
                zipUploaded: zipUploaded
            }

            // Extract ZIP file to the deployment folder (for this app-deployment and clear the zip)
            var latestDeployId = app.locals.settings.Applications[req.params.appId].latestDeployId;
            var dir = 'deployments/'+req.params.appId+'-'+latestDeployId;
            if (fs.existsSync(dir)){ rmDir(dir);}
            fs.mkdirSync(dir);
            extract(req.file.path, {dir: dir}, function (err) {
                console.log('file unzipped');
                fs.unlinkSync(req.file.path);

                // Execute npm start in process folder
                const fork = require('child_process').fork;
                app.locals.settings.deployedProcesses[oldAppId+'-'+latestDeployId] = fork('./deployments/'+oldAppId+'-'+latestDeployId+'/server.js');

                // Increase deploy ID
                app.locals.settings.Applications[req.params.appId].latestDeployId++;

                var output = {
                    id: (app.locals.settings.Applications[req.params.appId].latestDeployId - 1),
                    type: '/applications/deployments',
                    action: 'Create',
                    result:'Success',
                    shortMessage: 'Deployment Created',
                    longMessage: 'Deployment Created Successfully'
                }
                res.send(output);

            });

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
