var router = require('express').Router();
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var User = require('../models/userModel');

var nprScope = [
  'identity.readonly',
  'identity.write',
  'listening.readonly',
  'listening.write',
  'localactivation'
];

passport.use('npr', new OAuth2Strategy({
  authorizationURL: 'https://api.npr.org/authorization/v2/authorize',
  tokenURL: 'https://api.npr.org/authorization/v2/token',
  clientID: process.env.NPR_CLIENT_ID,
  clientSecret: process.env.NPR_CLIENT_SECRET,
  state: true,
  callbackURL: 'http://localhost:3000/auth/npr/callback'
}, function(accessToken, refreshToken, profile, done){
  process.nextTick(function(){
    // save access token
    User.findOneAndUpdate({}, {npr_token: accessToken}, function(err, users){
      if(err){
        console.log('Error saving npr token:', err);
      } else {
        console.log('Saved npr token', users);
      }
    });

    return done(null, profile);
  });
}));

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(obj, done){
  done(null, obj);
});

router.get('/npr', passport.authenticate('npr', {scope: nprScope}), function(req, res){
  // nothing
  console.log('authenticating with npr');
});

router.get('/npr/callback', passport.authenticate('npr', {successRedirect: '/npr', failureRedirect: '/settings'}), function(req, res){
  console.log('npr callback req:', req);
  res.sendStatus(200);
});

router.get('/npr/logout', function(req, res){
  req.logout();
  res.redirect('/settings');
});


router.get('/npr/info', ensureAuthenticated, function(req, res){
  res.send(req.user);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/settings');
}



exports.router = router;