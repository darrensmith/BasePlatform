

var passport = require("passport");

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
            req.models.PlatformDetails.find({ }, function (err, platformDetails) {
                res.send(platformDetails[0]);
            });
        }
    ],
    
    /**
     * Creates a new platform details record (not implemented, must update existing record)

     * parameters: 
     * produces: 
     */
    post: [
        passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            res.sendStatus(501);
        }
    ],

    /**
     * Updates a platform details record (must be admin company)

     * parameters: 
     * produces: 
     */
    put: [
        passport.authenticate(['basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            req.models.PlatformDetails.find({ }, function (err, platformDetails) {
                
                if(!platformDetails || !platformDetails[0]){
                    var output = {
                        result:'Error',
                        code: '',
                        shortMessage: 'Platform Details Update Failed',
                        longMessage: 'Platform Details could not be updated as they do not exist (FATAL)',
                        correlationId: ''
                    }
                    res.send(output);
                } else {
                    platformDetails[0].name                     = req.body.name;
                    platformDetails[0].description              = req.body.description;
                    platformDetails[0].platformApiUrl           = req.body.platformApiUrl;
                    platformDetails[0].platformConnectUrl       = req.body.platformConnectUrl;
                    platformDetails[0].dateLastModified         = new Date(new Date().getTime()); 
                    platformDetails[0].lastModifiedByEntityId   = req.user.companyId;
                    platformDetails[0].save(function (err) {
                        if(err){
                            var output = {
                                result:'Error',
                                code: '',
                                shortMessage: 'Platform Details Update Failed',
                                longMessage: 'Platform Details could not be updated - refer to supplementary field',
                                correlationId: '',
                                supplementary: err
                            }
                        } else {
                            var output = {
                                type: '/platform-details',
                                action: 'Update',
                                result:'Success',
                                shortMessage: 'Platform Details Updated',
                                longMessage: 'Platform Details were updated successfully'
                            }
                        }
                        res.send(output);
                    });
                }


            });
        }
    ],

    /**
     * Deletes a platform details record (not implemented, cannot delete a platform details record)

     * parameters: 
     * produces: 
     */
    delete: [
        passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            res.sendStatus(501);
        }
    ]
    
};
