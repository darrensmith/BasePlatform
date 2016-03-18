module.exports = function(db, cb)
{
    var Users = db.define('Users', {
        userId	                    :   { type: 'integer', key: true },
        firstName                   :   { type: 'integer'},
        lastName                 	:   { type: 'text'},
        emailAddress	            :   { type: 'text'}
    });
}