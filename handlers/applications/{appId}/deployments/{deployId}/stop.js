var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /applications/{appId}/deployments/{deployId}/stop
 */
module.exports = {
    
    /**
     * Stops a deployed process

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
                    type: '/applications/deployments/stop',
                    action: 'Stop',
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
                    type: '/applications/deployments/stop',
                    action: 'Stop',
                    result:'Error',
                    shortMessage: 'Deployment Does Not Exist',
                    longMessage: 'Deployment Does Not Exist'
                }
                res.send(output);
            }

            // Kill child process
            app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId].kill('SIGINT');

            var output = {
                id: '',
                type: '/applications/deployments/stop',
                action: 'Stop',
                result:'Success',
                shortMessage: 'Process Stopped',
                longMessage: 'Process Stopped Successfully'
            }
            res.send(output);

        }
    ]
    
};