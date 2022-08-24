var
    LocalStrategy = require('passport-local').Strategy,
    User = require('../app/models/user/user-schema').UserModel;


module.exports = function(passport) {

    passport.serializeUser(function(user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function(id, done) {
        var user = new User();
        user.findUserObject({
            userId: id
        }).then(function(r) {
            done(null, r);
        });
    });

    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      }, function(req, email, password, done) {
        console.log('in ixit local strategy');

        var user = new User();

        user.checkAuthCredentials(email, password, req).then(function(r) {
            // console.log('Received user Info');
            //Expects the user account object
            return done(null, r);
        }, function(err) {
            // console.log('user credentials were not valid');
            //return done(err)
            // we don't need to return the specific error here, just that there was an error
            return done(null);
        });

    }));



    //used for API endpoint authentication
    passport.isAuthAuthenticated = passport.authenticate('basic', { session : true });
};