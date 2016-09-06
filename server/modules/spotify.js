var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

// configure spotify
var playlist = {};
var player = {};
var ready = function(){
  console.log('spotify play loaded.', spotify);
  playlist = spotify.playlistContainer.getPlaylist(0);
  player = spotify.player;
};

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);

var spotifyModule = {};
var status = {};

spotifyModule.emitStatus = function(socket){
  socket.on('get spotify status', function(data){
    if(playlist){
      status.playlist = playlist;
    }
    // if(player){
    //   status.player = player;
    // }

    socket.emit('spotify status', {data: status.playlist});
    // console.log('spotify status', spotify.playlistContainer);
  });
};

// spotifyModule.command

module.exports = spotifyModule;
