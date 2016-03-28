var passport = require("passport");
var fs = require('fs');

/**
 * Operations on /platform-details
 */
module.exports = {
    
    /**
     * Get platform details

     * parameters: 
     * produces: 
     */
    get: [
        function (req, res) {

            for (var i = 0; i < app.locals.settings.PlatformDetails.length; i++) {
                if(app.locals.settings.PlatformDetails[i]){
                    if(req.params.parameter == app.locals.settings.PlatformDetails[i].parameter)
                        var output = app.locals.settings.PlatformDetails[i];
                }
            }

            if(!output)
                var output = {};

            res.send(output);
        }
    ],
    
    /**
     * Updates a platform details record

     * parameters: 
     * produces: 
     */
    put: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            
            for (var i = 0; i < app.locals.settings.PlatformDetails.length; i++) {
                if(app.locals.settings.PlatformDetails[i] && req.params.parameter == app.locals.settings.PlatformDetails[i].parameter)
                    app.locals.settings.PlatformDetails[i].value = req.body.value;
            }

            fs.writeFile('./config/saved-state/platformDetails.json',JSON.stringify(app.locals.settings.PlatformDetails),function(err){
                if(err){console.log('Failed to updated platform details file');}
            });

            var output = {
                id: (app.locals.settings.latestAppId - 1),
                type: '/platform-details',
                action: 'Update',
                result:'Success',
                shortMessage: 'Updated Successfully',
                longMessage: 'Platform detail parameter updated successfully'
            }
            res.send(output);
        }
    ],

    /**
     * Deletes a platform details record

     * parameters: 
     * produces: 
     */
    delete: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            
            for (var i = 0; i < app.locals.settings.PlatformDetails.length; i++) {
                if(app.locals.settings.PlatformDetails[i] && req.params.parameter == app.locals.settings.PlatformDetails[i].parameter)
                    delete app.locals.settings.PlatformDetails[i];
            }

            fs.writeFile('./config/saved-state/platformDetails.json',JSON.stringify(app.locals.settings.PlatformDetails),function(err){
                if(err){console.log('Failed to updated platform details file');}
            });

            var output = {
                id: (app.locals.settings.latestAppId - 1),
                type: '/platform-details',
                action: 'Delete',
                result:'Success',
                shortMessage: 'Deleted Successfully',
                longMessage: 'Platform detail parameter deleted successfully'
            }
            res.send(output);
        }
    ],    

    
};
