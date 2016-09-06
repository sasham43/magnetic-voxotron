var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;

// configure spotify
var playlist = {};
var player = {};
var spotifySocket;
var spotifyModule = {};
var status = {};
status.playing = false;
var allPlaylists;
var myPlaylistContainer;
var tracks = [];
var playlistNames = [];

var ready = function(err){
  if(err) {
      console.log('spotify login failed:', err);
  } else {
    myPlaylistContainer = spotify.playlistContainer;
    allPlaylists = myPlaylistContainer.getPlaylists();
    playlist = allPlaylists[0]; // temporary
    tracks = playlist.getTracks();
    player = spotify.player;
    allPlaylists.map(function(playlist){
      playlistNames.push(playlist.name);
    });
    status.playlistNames = playlistNames;
    if(spotifySocket){
      console.log('spotifySocket', spotifySocket);
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
    if(playlistNames){
      status.playlistNames = playlistNames;
    }
    if(player){
      status.player = player;
    }

    socket.emit('spotify status', status);
    // console.log('spotify status', spotify.playlistContainer);
  });
};

spotifyModule.command = function(socket){
  spotifySocket = socket;

  socket.on('spotify command', function(data){
    console.log('spotify command:', data);
    switch(data.cmd){
      case 'play':
        spotifyPlay(data.track);
        break;
      case 'next':
        player.pause();
        break;
    }
  });
};

spotifyModule.playlistSelect = function(socket){
  spotifySocket = socket;
  socket.on('spotify select playlist', function(data){
    console.log('spotify select playlist:', data);
    playlist = allPlaylists[data.index]; // temporary
    tracks = playlist.getTracks();
    socket.emit('spotify status', status);
  });
};

module.exports = spotifyModule;

function spotifyPlay(index){
  if (!status.playing && (player.currentSecond !== 0) ){
  //  console.log('spotify resume', status.playing, player.currentSecond);
   player.resume();
   status.playing = true;
  } else if(status.playing){
    // console.log('spotify pause', status.playing, player.currentSecond);
    player.pause();
    status.playing = false;
  } else {
    // console.log('spotify play new');
    var track = spotify.createFromLink(tracks[index].link);
    player.play(track);
    status.playing = true;
  }
}
