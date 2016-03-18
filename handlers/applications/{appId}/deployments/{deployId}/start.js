var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /applications/{appId}/deployments/{deployId}/start
 */
module.exports = {
    
    /**
     * Starts a deployed process

     * parameters: appId, deployId
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var application = app.locals.settings.Applications[req.params.appId];

            if(!application){
                var output = {
                    id: '',
                    type: '/applications/deployments/start',
                    action: 'Start',
                    result:'Error',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            }

            var deployment = application.Deployments[req.params.deployId]

            if(!deployment){
                var output = {
                    id: '',
                    type: '/applications/deployments/start',
                    action: 'Start',
                    result:'Error',
                    shortMessage: 'Deployment Does Not Exist',
                    longMessage: 'Deployment Does Not Exist'
                }
                res.send(output);
            }

            if(deployment.process){
                var output = {
                    id: '',
                    type: '/applications/deployments/start',
                    action: 'Start',
                    result:'Error',
                    shortMessage: 'Process is already running',
                    longMessage: 'Process is already running'
                }
                res.send(output);
            }

            // TODO: Start process
            const fork = require('child_process').fork;
            app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId] = fork('./deployments/'+req.params.appId+'-'+req.params.deployId+'/server.js');

            var output = {
                id: (app.locals.settings.Applications[req.params.appId].latestDeployId - 1),
                type: '/applications/deployments/start',
                action: 'Start',
                result:'Success',
                shortMessage: 'Process Started',
                longMessage: 'Process Started Successfully'
            }
            res.send(output);

        }
    ]
    
};