var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /applications/{appId}/deployments/{deployId}/restart
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
                    type: '/applications/deployments/restart',
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
                    type: '/applications/deployments/restart',
                    action: 'Stop',
                    result:'Error',
                    shortMessage: 'Deployment Does Not Exist',
                    longMessage: 'Deployment Does Not Exist'
                }
                res.send(output);
            }

            // Kill child process and restart it
            if(app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId]){
                app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId].kill('SIGINT');                
            }
            const fork = require('child_process').fork;
            app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId] = fork('./deployments/'+req.params.appId+'-'+req.params.deployId+'/server.js');

            var output = {
                id: '',
                type: '/applications/deployments/restart',
                action: 'Stop',
                result:'Success',
                shortMessage: 'Process Restarted',
                longMessage: 'Process Restarted Successfully'
            }
            res.send(output);

        }
    ]
    
};