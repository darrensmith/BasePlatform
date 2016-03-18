// database.js

var orm = require("orm");

var connection = null;

function setup(db) {
    db.load("../models/index", function (err2)
        {
            if (err2)   
                throw err2;
            db.sync();
        });
}

module.exports = function (req,cb) {
  var dbConnection = req.app.get('dbConnection');
  if (dbConnection) return cb(null, dbConnection);
  orm.connect("mysql://root:root@localhost:8889/party", function (err, db) {
    if (err) return cb(err);
    db.settings.set('instance.cache', false);
    req.app.set('dbConnection',db);
    setup(db);
    cb(null, db);
  });  
};