var passport = require("passport");

/**
 * Operations on /applications/{appId}
 */
module.exports = {
    
    /**
     * Get detail for a specified applicaation

     * parameters: jobId
     * produces: 
     */
    get: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            var appReturned = false;
            var statsReturned = false;

            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(appDetails){
                appDetails.Statistics = app.locals.settings.AppStatistics[req.params.appId];
                statsReturned = true;
            }

            if(!appDetails){
                var output = {}
                res.send(output);
            } else {
                res.send(appDetails);
            }
        } 
    ],
    
    /**
     * Update an existing application

     * parameters: appId
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
     * Deletes an existing application
     *
     * parameters: appId
     * produces: 
     */
    delete: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var appDetails = app.locals.settings.Applications[req.params.appId];

            if(appDetails){
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
