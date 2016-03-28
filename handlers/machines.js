var passport = require("passport");

/**
 * Operations on /machines
 */
module.exports = {
    
    /**
     * Get list of machines

     * parameters: 
     * produces: 
     */
    get: [ 
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {
            var output = app.locals.settings.Machines;
            res.send(output);
        }
    ],
    
    /**
     * Creates a new machines

     * parameters: 
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var name = req.body.name;
            var description = req.body.description;
            var machineUrl = req.body.machineUrl;

            app.locals.settings.Machines.push({
                machineId: app.locals.settings.latestMachineId,
                name: name,
                description: description,
                machineUrl: machineUrl
            });
            app.locals.settings.latestMachineId++;

            var output = {
                id: (app.locals.settings.latestMachineId - 1),
                type: '/machines',
                action: 'Create',
                result:'Success',
                shortMessage: 'Machine Created',
                longMessage: 'Machine Created Successfully'
            }
            res.send(output);
        }
    ]
    
};
