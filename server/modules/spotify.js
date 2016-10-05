var router = require('express').Router();
var async = require('async');
var request = require('request');
var User = require('../models/userModel');
var spotify = require('node-spotify')({appkeyFile: './server/modules/spotify_appkey.key'});
var spotifyUser = process.env.SPOTIFY_USER;
var spotifyPass = process.env.SPOTIFY_PASS;
var io = require('../server.js').io;
var controls = require('./control.js');

// configure spotify
var playlist = {};
var album = {};
var player = {};
var spotifySocket;
var status = {};
status.playing = false;
status.trackList = [];
status.trackNumber = 0;
status.albumNames = [];
var allAlbums;
var allPlaylists;
var myPlaylistContainer;
var tracks = [];
var accessToken;
var refreshToken;

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

  albumSelect: function(socket){
    spotifySocket = socket;
    socket.on('spotify select album', function(data){
      console.log('spotify select album:', data);
      album = allAlbums[data.index];

      tracks = album.album_tracks;
      tracks.map(function(track){
        status.trackList.push(track.track_name);
      });

      socket.emit('spotify status', status);
    });
  },

  updateAlbums: function(socket){
    spotifySocket = socket;
    socket.on('spotify update albums', function(){
      console.log('updating albums...');
      async.series([
        getAccessToken,
        updateAlbums
      ]);
    });
  },

  getAlbums: function(socket){
    spotifySocket = socket;
    socket.on('spotify get albums', function(){
      getAlbums();
    });
  },

  cancel: function(){
    player.pause();
  }
};

exports.cancel =  function(){
  player.pause();
};

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

function getAccessToken(cb){
  if(accessToken){
    cb(null, accessToken);
  } else {
    User.find({}, function(err, users){
      if(err){
        console.log('error grabbing token');
        res.sendStatus(401);
      } else {
        accessToken = users[0].spotify_token;
        refreshToken = users[0].spotify_refresh;

        console.log('got spotify token.');
        cb(null, accessToken);
        //return accessToken;
      }
    });
  }
}

function updateAlbums(cb){
  var albums = [];
  var options = {
    url: 'https://api.spotify.com/v1/me/albums?limit=50',
    headers: {'Authorization': 'Bearer ' + accessToken}, // need to grab token
    json: true
  };

  // recursively get all albums
  var pages = 0;
  var getSpotifyAlbums = function(err, response, body){
    if(err){
      console.log('Error getting albums.');
    }
    console.log('Getting page', pages);
    if(body.items){
      body.items.map(function(album){
        album = album.album;
        var tracks = [];
        album.tracks.items.map(function(track){
          var temp = {
            track_name: track.name,
            index: track.track_number,
            uri: track.uri
          };
          tracks.push(temp);
        });
        albums.push({
          album_name: album.name,
          album_tracks:tracks,
          album_uri: album.uri,
          album_images: {big: album.images[0].url, med: album.images[1].url, sml: album.images[2].url}
        });
      });
      console.log('got spotify albums.');

      if(body.next){
        var options = {
          headers: {'Authorization': 'Bearer ' + accessToken}, // need to grab token
          json: true
        };
        options.url = body.next;
        pages++;
        request.get(options, getSpotifyAlbums);
      } else {
        // status.albums = albums;
        // spotifySocket.emit('spotify albums', {albums: albums});
        User.findOneAndUpdate({}, {spotify_albums:albums}, function(err, users){
          if(err){
            console.log('error saving spotify albums:', err);
          } else {
            console.log('saved spotify albums.');
            spotifySocket.emit('spotify albums', {albums: albums});
          }
        });
      }

    } else if(body.error) {
      console.log('Error.', body.error);
      if(body.error.status == 401){
        // get refresh token and start again
        // console.log('secret secrets:', process.env.SPOTIFY_CLIENT_ID, process.env.SPOTIFY_CLIENT_SECRET);
        var secret = process.env.SPOTIFY_CLIENT_SECRET;
        var id = process.env.SPOTIFY_CLIENT_ID;
        var buffer = Buffer(id + ':' + secret);
        buffer = buffer.toString('base64');
        var options = {
          url: 'https://accounts.spotify.com/api/token',
          form: {grant_type: 'refresh_token',refresh_token: refreshToken},
          headers:{
            'Authorization': 'Basic ' + buffer,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        };

        request.post(options, function(err, response, body){
          if(err){
            console.log('error refreshing spotify token:', err);
          }
          body = JSON.parse(body);
          // console.log('refresh!', body.access_token);
          User.findOneAndUpdate({}, {spotify_token: body.access_token}, function(err, users){
            if(err){
              console.log('error saving refreshed spotify token:', err);
            } else {
              accessToken = body.access_token;
              console.log('saved refreshed spotify token.');
              var options = {
                url: 'https://api.spotify.com/v1/me/albums?limit=50',
                headers: {'Authorization': 'Bearer ' + accessToken}, // need to grab token
                json: true
              };
              request.get(options, getSpotifyAlbums);
            }
          })
        });
      }
      // res.send(body);
    }
  };
  request.get(options, getSpotifyAlbums);
}

function getAlbums(){
  User.find({}, function(err, users){
    if(err){
      console.log('error getting spotify albums from db:', err);
    } else {
      allAlbums = users[0].spotify_albums;
      status.albumNames = [];

      allAlbums = allAlbums.filter(function(album, index){
        if (index < 10){
          return true;
        }  else {
          return false;
        }
      })

      console.log('got spotify albums from db.');
      spotifySocket.emit('spotify albums', {albums: allAlbums});
    }
  });
}
