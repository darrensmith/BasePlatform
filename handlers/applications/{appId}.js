var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /applications/{appId}
 */
module.exports = {
    
    /**
     * Get detail for a specified applicaation

     * parameters: appId
     * produces: 
     */
    get: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var appDetails = app.locals.settings.Applications[req.params.appId];

            var appOutput = {
                appId: appDetails.appId,
                title: appDetails.title,
                description: appDetails.description,
                appPath: appDetails.appPath,
                targetServer: appDetails.targetServer,
                route:appDetails.route
            }

            if(appOutput){
                appOutput.Statistics = app.locals.settings.AppStatistics[req.params.appId];
            }

            if(!appOutput){
                var output = {}
                res.send(output);
            } else {
                res.send(appOutput);
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
                app.locals.settings.proxyRoutes[req.body.route] = {
                    targetServer: req.body.targetServer
                }

                fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                    if(err){console.log('Failed to update local applications state file');}
                });

                fs.writeFile('./config/saved-state/proxyRoutes.json',JSON.stringify(app.locals.settings.proxyRoutes),function(err){
                    if(err){console.log('Failed to update proxy routes file');}
                });

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

                // TODO: Terminate process and delete deployment folder

                // Delete App Details incl. deployment, proxy route and statistics.
                delete app.locals.settings.AppStatistics[req.params.appId];
                delete app.locals.settings.proxyRoutes[appDetails.route];
                delete app.locals.settings.Applications[req.params.appId];

                fs.writeFile('./config/saved-state/applications.json',JSON.stringify(app.locals.settings.Applications),function(err){
                    if(err){console.log('Failed to update local applications state file');}
                });

                fs.writeFile('./config/saved-state/proxyRoutes.json',JSON.stringify(app.locals.settings.proxyRoutes),function(err){
                    if(err){console.log('Failed to update proxy routes file');}
                });
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
                    id: req.params.appId,
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
