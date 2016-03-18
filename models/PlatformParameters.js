module.exports = function(db, cb)
{
    var Events = db.define('Events', {
        eventId                 		:   { type: 'integer', key: true },
        eventName                    	:   { type: 'text'},
        htmlDescription                 :   { type: 'text'},
        textDescription            		:   { type: 'text'}
    });
}