var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

// configure spotify
var playlist = {};
var player = {};
var spotifySocket = {};
var spotifyModule = {};
var status = {};
var tracks = [];
var playlistNames = [];

var ready = function(err){
  if(err) {
      console.log('spotify login failed:', err);
  } else {
    var myPlaylistContainer = spotify.playlistContainer;
    var numPlaylists = myPlaylistContainer.numPlaylists;
    var allPlaylists = myPlaylistContainer.getPlaylists();
    playlist = allPlaylists[0]; // temporary
    tracks = playlist.getTracks();
    player = spotify.player;
    allPlaylists.map(function(playlist){
      playlistNames.push(playlist.name);
    });
    status.playlistNames = playlistNames;
    if(spotifySocket){
      spotifySocket.emit('spotify status', status);
    }
    console.log('spotify play loaded.');
  }
};

spotify.on({
  ready: ready
});

spotify.login(spotifyUser, spotifyPass, false, false);

spotifyModule.emitStatus = function(socket){
  spotifySocket = socket;
  socket.on('get spotify status', function(data){
    // if(playlist){
    //   status.playlist = playlist;
    // }
    if(playlistNames){
      status.playlistNames = playlistNames;
    }
    // if(player){
    //   status.player = player;
    // }

    socket.emit('spotify status', status);
    // console.log('spotify status', spotify.playlistContainer);
  });
};

spotifyModule.command = function(socket){
  spotifySocket = socket;

  socket.on('spotify command', function(data){
    console.log('spotify command:', tracks[0].link);
    switch(data){
      case 'play':
        var track = spotify.createFromLink(tracks[0].link);
        player.play(track);
        break;
      case 'next':
        player.pause();
        break;
    }
  });
}

module.exports = spotifyModule;
