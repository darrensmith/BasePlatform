var passport = require("passport");

/**
 * Operations on /applications
 */
module.exports = {
    
    /**
     * Get list of applications

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
     * Creates a new application

     * parameters: 
     * produces: 
     */
    post: [
        //passport.authenticate(['bearer','basic','oauth2-client-password'], {failureFlash:true}),
        function (req, res) {

            var name = req.body.name;
            var description = req.body.description;
            var machineUrl = req.body.machineUrl;

            var appExists = false;

            for (var i = app.locals.settings.Machines.length - 1; i >= 0; i--) {
                if(app.locals.settings.Machines[i].name == name)
                    appExists = true;
            }

            if(!appExists){
                app.locals.settings.Machines.push({
                    machineId: app.locals.settings.latestMachineId,
                    name: name,
                    description: description,
                    machineUrl: machineUrl
                });
                app.locals.settings.latestMachineId++;
            }

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
