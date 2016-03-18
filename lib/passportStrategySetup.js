/* passportStrategySetup.js
	
	This file provides the verify callbacks for each passport.js strategy that is implemented

*/

var crypto = require('crypto');
var uid = require('uid2');

var passportStrategySetup = {}

passportStrategySetup.ClientPasswordStrategy = function(req, clientId, clientSecret, done) {
  req.models.Companies.fetchCompanyAndSecret(clientId,function(company,err){
    var clientSecretHash = crypto.createHash('sha1').update(clientSecret + company.clientSecretSalt).digest('hex');
    if (err) { return done(null, false, {message: 'Error fetching company'}); }
    else if (!company) { return done(null, false, {message: 'Company does not exist'}); }
    else if (company.clientSecretHash != clientSecretHash) { return done(null, false, {message: 'Client secret is incorrect'}); }
    else if (req.params.companyId && req.params.companyId != company.companyId) { return done(null, false, {message: 'Client ID and Secret are for a different company'}); }
    else { 
      company.userType = "Company";
      return done(null, company); 
    }
  });
}

passportStrategySetup.CheckAdminCompanyStrategy = function(req, callback) {
  console.log('check admin auth strategy');
  req.models.Companies.checkForAdmin(function(isAdmin){
    if(isAdmin){
        callback(null,false);
    } else {
        var company = {message:'company is real'}
        callback(null,company);
    }
  });
}


/*
  Note: Perhaps we should validate path scopes here so as to keep the logic separated from the
  actual handlers/controllers. Scopes could be format of:
  [object]:create (eg; "orders:create")
  [object]:read (eg; "users:read")
  [object]:update (eg; "warehouses:update")
  [object]:delete (eg; "areas:delete")

  Could also include object and permission delegates of "all".
  Eg; Scope of "all:all" would give user access to do EVERYTHING within company
      Scope of "all:read" would give user read access for everything within company
      Scope of "users:all" would give user all access to users object only

  Other:
  Scope can also have a modifier. 
  Eg; users:all:self only gives permission to user to perform all functions on own user object but no others
  Eg; users:all:child only gives permission to user to perform all functions on direct child user objects
  Eg; users:all:childPropogated only gives permission to user to perform all functions on all child user objects
      (even children of children)

  User object must be assigned the scopes by an API call. Recorded in oAuthUserScopes
  User can then delegate scopes to a third party for which a bearer token is provided.
  These scopes are recorded in oAuthTokenScopes.
    
*/
passportStrategySetup.BearerStrategy = function(req, token, done) {
  console.log('bearer auth strategy');
  tokenHash = crypto.createHash('sha1').update(token).digest('hex');
  req.models.Users.fetchUserByAccessToken(tokenHash,function(user,err){
    if (err) { return done(null, false, {message: 'Access token is invalid'}); }
    else if (!user) { return done(null, false, {message: 'Access token is invalid'}); }
    else if (req.params.companyId && req.params.companyId != user.companyId) { return done(null, false, {message: 'Access token is invalid for the specified company'}); }
    else { 
      var scopeStore = [];
      for (i = 0; i < user.scopes.length; i++) { 
        scopeStore.push(user.scopes[i].scope);
      }
      delete user['scopes'];
      return done(null, user, { scope: scopeStore }); 
    }
  });
}

module.exports = passportStrategySetup;