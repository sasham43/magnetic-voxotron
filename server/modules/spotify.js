var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

// configure spotify
var ready = function(){
  console.log('spotify play loaded.');
};

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);

io.on('connection', function(socket){
  socket.on('get spotify status', function(data){
    socket.emit('spotify status', {data: 'hello'});
  });
  console.log('spotify socket connected');
});

module.exports = router;
