var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

var spotifyModule = {};
var playlist = {};

// configure spotify
var ready = function(){
  console.log('spotify play loaded.');
  // playlist = spotify.playlistContainer.numPlaylists;
  var track = spotify.createFromLink('spotify:track:05JqOBN6XW4eFUVQlgR0I3');
  player.play(track);
};

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);
// var playlist = spotify.playlistContainer.getPlaylist(0);
var player = spotify.player;

spotifyModule.emitStatus = function(socket){
  socket.on('get spotify status', function(data){
    socket.emit('spotify status', player);
    // console.log('spotify status', spotify.playlistContainer);
  });
};

module.exports = spotifyModule;
