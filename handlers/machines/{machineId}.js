var passport = require("passport");

/**
 * Operations on /machines/{machineId}
 */
module.exports = {
    
    /**
     * Get detail for a specified machine

     * parameters: machineId
     * produces: 
     */
    get: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var machineDetails = app.locals.settings.Machines[req.params.machineId];

            if(!machineDetails){
                var output = {}
                res.send(output);
            } else {
                res.send(machineDetails);
            }
        } 
    ],
    
    /**
     * Update an existing machine

     * parameters: machineId
     * produces: 
     */
    put: [
        //passport.authenticate(['basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(appDetails){
                delete app.locals.settings.proxyRoutes[appDetails.route];
                appDetails.title = req.body.title;
                appDetails.description = req.body.description;
                appDetails.appPath = req.body.appPath;
                appDetails.targetServer = req.body.targetServer;
                appDetails.route = req.body.route;
                app.locals.settings.proxyRoutes[req.body.route].targetServer = req.body.targetServer;
                var output = {
                    id: req.params.appId,
                    type: '/applications',
                    action: 'Update',
                    result:'Success',
                    shortMessage: 'Application Updated',
                    longMessage: 'Application Updated Successfully'
                }
                res.send(output);
            }

            if(!appDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications',
                    action: 'Update',
                    result:'Failed',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            }
        } 
    ],
    
    /**
     * Deletes an existing machine
     *
     * parameters: machineId
     * produces: 
     */
    delete: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(appDetails){

                // TODO: Terminate process and delete deployment folder

                // Delete App Details incl. deployment, proxy route and statistics.
                delete app.locals.settings.AppStatistics[req.params.appId];
                delete app.locals.settings.proxyRoutes[appDetails.route];
                delete appDetails;
            }

            if(!appDetails){
                var output = {
                    id: req.params.appId,
                    type: '/applications',
                    action: 'Delete',
                    result:'Failed',
                    shortMessage: 'Application Does Not Exist',
                    longMessage: 'Application Does Not Exist'
                }
                res.send(output);
            } else {
                var output = {
                    id: appId,
                    type: '/applications',
                    action: 'Delete',
                    result:'Success',
                    shortMessage: 'Application Deleted',
                    longMessage: 'Application Deleted Successfully'
                }
                res.send(output);
            }
        }
    ]
    
};
