

var passport = require("passport");

/**
 * Operations on /tools/clear-server
 */
module.exports = {
    
    /**
     * Wipes all data from server

     * parameters: 
     * produces: 
     */
    get: [
        passport.authenticate(['basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var resources = [
                'Companies',
                'CompanyExtensions',
                'oAuthCodes',
                'oAuthSecrets',
                'oAuthTokens',
                'oAuthTokenScopes',
                'oAuthUserScopes',
                'Orders',
                'PlatformApplications',
                'PlatformDetails',
                'Products',
                'ProductSkus',
                'ServiceExtensions',
                'StockExpectations',
                'StockReceipts',
                'StockTransfer',
                'TradeAgreements',
                'Transit',
                'Users',
                'WarehouseAreas',
                'WarhouseAreaSlots',
                'Warehouses'
            ];

            for (var a = 0; a < resources.length; a++) { 
                if(req.models[resources[a]]){
                    req.models[resources[a]].find({}, function (err, objects){
                        if(objects && objects[0]){
                            for (var b = 0; b < objects.length; b++) {
                                objects[b].remove(function (err) {}); 
                            }
                        }
                    });
                }
            }

            var output = {
                type: '/tools/clear-server',
                action: 'Clear Server',
                result:'Success',
                shortMessage: 'Server Clearance Started',
                longMessage: 'Server Clearance has begun. It may take a little while.'
            }
            res.send(output);
     
        } 
    ]
  
};
