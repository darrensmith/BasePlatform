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
            var output = app.locals.settings.PlatformDetails;
            res.send(output);
        }
    ],
    
    /**
     * Creates a new platform details record

     * parameters: 
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            app.locals.settings.PlatformDetails.push({
                parameter: req.body.parameter,
                value: req.body.value
            })

            fs.writeFile('./config/saved-state/platformDetails.json',JSON.stringify(app.locals.settings.PlatformDetails),function(err){
                if(err){console.log('Failed to updated platform details file');}
            });

            var output = {
                id: (app.locals.settings.latestAppId - 1),
                type: '/platform-details',
                action: 'Create',
                result:'Success',
                shortMessage: 'Created Successfully',
                longMessage: 'Platform detail parameter created successfully'
            }
            res.send(output);
        }
    ]

    
};
