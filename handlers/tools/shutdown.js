

var passport = require("passport");

/**
 * Operations on /tools/shutdown
 */
module.exports = {
    
    /**
     * Shutdown server

     * parameters: 
     * produces: 
     */
    get: [
        passport.authenticate(['basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
        	process.exit();
            res.sendStatus(200);
        } 
    ]
  
};
