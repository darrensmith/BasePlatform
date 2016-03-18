module.exports = function(db, cb)
{
    var Applications = db.define('Applications', {
        appId   	                :   { type: 'integer', key: true },
        name	                    :   { type: 'text'},
        description	                :   { type: 'text'},
        appPath		                :   { type: 'text'},
        lastUploadedDate			: 	{ type: 'text'},
        gitRepository               :   { type: 'text'},
        dateCreated                 :   { type: 'text'},
        dateLastModified            :   { type: 'text'},
        createdByEntityId           :   { type: 'integer'},
        lastModifiedByEntityId      :   { type: 'integer'}
    });
}