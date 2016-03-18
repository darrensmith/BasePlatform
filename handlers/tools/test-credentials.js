

var passport = require("passport");

/**
 * Operations on /tools/test-credentials
 */
module.exports = {
    
    /**
     * Test Credentials

     * parameters: 
     * produces: 
     */
    get: [
        passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            var output = {
                type: '/tools/test-credentials',
                action: 'Test Credentials',
                result:'Success',
                shortMessage: 'Credentials OK',
                longMessage: 'Credentials OK'
            }
            res.send(output);
        } 
    ]
  
};
