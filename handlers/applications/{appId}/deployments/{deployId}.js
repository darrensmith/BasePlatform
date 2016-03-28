var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /applications/{appId}/deployments/{deployId}
 */
module.exports = {
    
    /**
     * Get detail for a specified deployment

     * parameters: appId, deployId
     * produces: 
     */
    get: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var application = app.locals.settings.Applications[req.params.appId];

            if(!application){
                var output = {};
                res.send(output);
            }

            var deployment = application.Deployments[req.params.deployId];

            if(deployment){
                var output = {
                    deployId: deployment.deployId,
                    gitRepository: deployment.gitRepository,
                    zipLocation: deployment.zipLocation,
                    zipUploaded: deployment.zipUploaded,
                    status: deployment.status
                }
                res.send(output);
            } else {
                rest.send({});
            }

            
        } 
    ],
    
    /**
     * Update an existing deployment

     * parameters: appId, deployId, gitRepository, zipLocation
     * produces: 
     */
    put: [
        //passport.authenticate(['basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(!appDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications/deployments',
                    action: 'Update',
                    result:'Failed',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            }

            var deployDetails = appDetails.Deployments[req.params.deployId];

            if(!deployDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications/deployments',
                    action: 'Update',
                    result:'Failed',
                    shortMessage: 'Deployment Does Not Exist',
                    longMessage: 'Deployment Does Not Exist'
                }
                res.send(output);
            }

            deployDetails.gitRepository = req.body.gitRepository;
            deployDetails.zipLocation = req.body.zipLocation;

            fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                if(err){console.log('Failed to update local applications state file');}
            });

            var output = {
                id: req.params.appId,
                type: '/applications/deployments',
                action: 'Update',
                result:'Success',
                shortMessage: 'Deployment Updated',
                longMessage: 'Deployment Updated Successfully'
            }
            res.send(output);
        }
    ],
    
    /**
     * Deletes an existing deployment
     *
     * parameters: appId, deployId
     * produces: 
     */
    delete: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(!appDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications/deployments',
                    action: 'Delete',
                    result:'Failed',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            }

            var deployDetails = appDetails.Deployments[req.params.deployId];

            if(!deployDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications/deployments',
                    action: 'Delete',
                    result:'Failed',
                    shortMessage: 'Deployment Does Not Exist',
                    longMessage: 'Deployment Does Not Exist'
                }
                res.send(output);
            }

            // Terminate process and delete deployment details
            // TODO: Delete deployed process record, delete deployed folder
            if(app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId])
                app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId].kill('SIGINT');
            delete app.locals.settings.Applications[req.params.appId].Deployments[req.params.deployId];

            fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                if(err){console.log('Failed to update local applications state file');}
            });

            var output = {
                id: req.params.appId,
                type: '/applications/deployments',
                action: 'Delete',
                result:'Success',
                shortMessage: 'Deployment Deleted',
                longMessage: 'Deployment Deleted Successfully'
            }
            res.send(output);

        }
    ]
    
};
