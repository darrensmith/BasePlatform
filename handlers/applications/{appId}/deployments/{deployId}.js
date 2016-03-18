var passport = require("passport");

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

            var output = application.Deployments[req.params.deployId];
            res.send(output);
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

            app.locals.settings.deployedProcesses[req.params.appId+'-'+req.params.deployId].kill('SIGINT');
            delete deployDetails;

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
