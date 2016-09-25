var router = require('express').Router();
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;
var controls = require('./control.js');

// configure spotify
var playlist = {};
var player = {};
var spotifySocket;
var status = {};
status.playing = false;
status.trackList = [];
status.trackNumber = 0;
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
    // status.tracks = playlist.getTracks();
    tracks = playlist.getTracks();
    // status.tracks = tracks;
    player = spotify.player;

    // attach end of track function to player
    player.on({endOfTrack: function(){
      console.log('spotify track finished.');
      status.trackNumber++;
      if(status.trackNumber < tracks.length){
        console.log('next track:', tracks[status.trackNumber]);
        var track = spotify.createFromLink(tracks[status.trackNumber].link);
        player.play(track);
        status.playing = true;
        spotifySocket.emit('spotify status', status);
      } else {
        console.log('spotify playlist finished.');
        status.playing = false;
        spotifySocket.emit('spotify status', status);
      }
    }
  });

    // make list of names and send to client
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

module.exports = spotifyModule = {
  emitStatus: function(socket){
    spotifySocket = socket;
    socket.on('get spotify status', function(data){
      if(playlistNames){
        status.playlistNames = playlistNames;
      }
      if(player){
        status.player = player;
      }

      socket.emit('spotify status', status);
      // console.log('spotify status', status);
    });
  },

  command: function(socket){
    spotifySocket = socket;

    socket.on('spotify command', function(data){
      console.log('spotify command:', data);
      switch(data.cmd){
        case 'play':
          spotifyPlayPause();
          // status.trackNumber = data.track;
          break;
        case 'next':
          spotifyNext();
          break;
        case 'select':
          spotifyPlay(data.track);
          // status.trackNumber = data.track;
          break;
        default:
          console.log('unrecognized command.');
      }

      socket.emit('spotify status', status);
    });
  },

  playlistSelect: function(socket){
    spotifySocket = socket;
    socket.on('spotify select playlist', function(data){
      console.log('spotify select playlist:', data);
      playlist = allPlaylists[data.index]; // temporary
      tracks = playlist.getTracks();
      status.trackList = []; // empty out tracklist for new playlist

      tracks.map(function(track){
        status.trackList.push(track.name);
      });

      socket.emit('spotify status', status);
    });
  },

  cancel: function(){
    player.pause();
  }
};

exports.cancel =  function(){
  player.pause();
};

// spotifyModule.;
//
// spotifyModule.;
//
// spotifyModule.;
//
// spotifyModule.

//module.exports = spotifyModule;

function spotifyPlayPause(){
  if (!status.playing && (player.currentSecond !== 0) ){
   console.log('spotify resume', status.playing, player.currentSecond);
   player.resume();
   status.playing = true;
  } else if(status.playing){
    console.log('spotify pause', status.playing, player.currentSecond);
    player.pause();
    status.playing = false;
  } else {
    console.log('spotify play new');
    var track = spotify.createFromLink(tracks[status.trackNumber].link);
    player.play(track);
    status.playing = true;
    // console.log('spotify control:', controls);
    // controls.cancelOther('spotify');
  }
}

function spotifyPlay(index){
  var track = spotify.createFromLink(tracks[index].link);
  player.play(track);
  status.playing = true;
  status.trackNumber = index;
  // console.log('spotify control:', this);
  controls.cancelOther('spotify');
}

function spotifyNext(){
  status.trackNumber++;
  var track = spotify.createFromLink(tracks[status.trackNumber].link);
  player.play(track);
  status.playing = true;
}
