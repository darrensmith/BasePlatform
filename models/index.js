var checkError = function(cb, err)
{
    if (err)
        return cb(err);
    return cb();
}

module.exports = function(db, cb)
{
    db.load("./Users.js", function (err) {checkError(cb, err)});
    db.load("./Applications.js", function (err) {checkError(cb, err)});
    db.load("./PlatformParameters.js", function (err) {checkError(cb, err)});

    var Users = db.models.Users;
    var Applications = db.models.Applications;
    var PlatformParameters = db.models.PlatformParameters;
}