var router = require('express').Router();
var passport = require('passport');
var request = require('request');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var SpotifyStrategy = require('passport-spotify').Strategy;
var User = require('../models/userModel');


// NPR OAuth

var nprScope = [
  'identity.readonly',
  'identity.write',
  'listening.readonly',
  'listening.write',
  'localactivation'
];

var nprStrategy = new OAuth2Strategy({
  authorizationURL: 'https://api.npr.org/authorization/v2/authorize',
  tokenURL: 'https://api.npr.org/authorization/v2/token',
  clientID: process.env.NPR_CLIENT_ID,
  clientSecret: process.env.NPR_CLIENT_SECRET,
  state: true,
  callbackURL: 'http://localhost:3000/auth/npr/callback'
}, function(accessToken, refreshToken, profile, done){
  process.nextTick(function(){
    // save access token
    // console.log('refreshToken:', accessToken, refreshToken, profile, done);
    User.findOneAndUpdate({}, {npr_token: accessToken, npr_refresh: refreshToken}, function(err, users){
      if(err){
        console.log('Error saving npr token:', err);
      } else {
        console.log('Saved npr token', users);
      }
    });

    return done(null, profile);
  });
});

// Spotify OAuth

var spotifyStrategy = new SpotifyStrategy({
  clientID: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
  callbackURL: 'http://localhost:3000/auth/spotify/callback'
}, function(accessToken, refreshToken, profile, done){
  process.nextTick(function(){
    // save access and refresh token
    User.findOneAndUpdate({}, {spotify_token: accessToken, spotify_refresh: refreshToken}, function(err, users){
      if(err){
        console.log('error saving spotify token:', err);
      } else {
        console.log('saved spotify token.', users);
      }

      return done(null, profile);
    });
  });
});

passport.use('npr', nprStrategy);
passport.use('spotify', spotifyStrategy);

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

router.get('/npr/refresh', function(req, res){
  console.log('npr strategy:', nprStrategy);
  User.find({}, function(err, users){
    if(err){
      console.log('error grabbing refresh token');
      res.sendStatus(401);
    } else {
      var refreshToken = users[0].npr_refresh;
      console.log('got npr refresh token:', refreshToken);

      var refreshOptions = {
        method: 'POST',
        url: 'https://api.npr.org/authorization/v2/token',
        form: {
          grant_type: 'refresh_token',
          client_id: process.env.NPR_CLIENT_ID,
          client_secret: process.env.NPR_CLIENT_SECRET,
          refresh_token: refreshToken
        },
        json: true
      };

      request(refreshOptions, function(err, response, body){
        if(err){
          console.log('error refreshing access token:', err);
          res.sendStatus(500);
        } else {
          console.log('refresh response:', body);
          accessToken = body.access_token;
          refreshToken = body.refresh_token;

          // save new tokens
          User.findOneAndUpdate({}, {npr_token: accessToken, npr_refresh: refreshToken}, function(err, users){
            if(err){
              console.log('Error saving npr token:', err);
              res.sendStatus(500);
            } else {
              console.log('Saved new npr tokens', users);
              res.redirect('/npr')
            }
          });
        }
      });
    }
  });
});


router.get('/npr/info', ensureAuthenticated, function(req, res){
  res.send(req.user);
});

router.get('/spotify', passport.authenticate('spotify', {scope: ['user-read-email', 'user-read-private', 'user-library-read'] }), function(req, res){
  // does not get called, gets redirected
});

router.get('/spotify/callback', passport.authenticate('spotify', {failureRedirect: '/settings'}), function(req, res){
  // success
  console.log('successfully authenticated.', req.user);
  res.redirect('/spotify');
});

router.get('/spotify/info', ensureAuthenticated, function(req, res){
  res.send(req.user);
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/settings');
}



exports.router = router;
