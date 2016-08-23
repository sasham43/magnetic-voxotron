var router = require('express').Router();
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;

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
    console.log('accessToken, refreshToken:', accessToken, refreshToken);
    module.exports.nprAccessToken = accessToken;
    return done(null, profile);
  });
}));

passport.serializeUser(function(user, done){
  done(null, user);
});

passport.deserializeUser(function(obj, done){
  done(null, obj);
});

router.get('/npr/callback', passport.authenticate('npr', {successRedirect: '/npr', failureRedirect: '/settings'}), function(req, res){
  console.log('npr callback req:', req);
  res.sendStatus(200);
});

router.get('/npr', passport.authenticate('npr', {scope: nprScope}), function(req, res){
  // nothing
  console.log('authenticating with npr');
});



module.exports = router;
