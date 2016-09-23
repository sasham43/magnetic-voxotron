var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');
var io = require('../server.js').io;
var fs = require('fs');
var Mplayer = require('mplayer');
var async = require('async');
var nprSDK = require('npr-one-sdk').default;
var controls = require('./control.js');
var player = new Mplayer();

var nprOne = new nprSDK();

var rec;
var started = false;
var accessToken = '';
var playing = false;
var skipped = false;
var nprSocket;

// player.on('status', function(){
//   if(nprSocket){
//     nprSocket.emit('npr status', player.status);
//   }
// });

player.on('stop', function(){
  console.log('story over, playing next.');

  rec.recordAction(nprSDK.Action.COMPLETED, rec.attributes.duration);

  nprOne.getRecommendation()
    .then(playRec)
});

module.exports = nprModule = {
  emitStatus: function(socket){
    nprSocket = socket;
    socket.on('get npr status', function(data){
      if(rec){
        player.status.title = rec.attributes.title;
      }
      socket.emit('npr status', player.status);
    });
  },

  command: function(socket){
    nprSocket = socket;
    socket.on('npr command', function(data){
      console.log('npr command:', data.cmd);
      switch(data.cmd){
        case 'play':
          nprPlay();
          break;
        case 'pause':
          player.pause();
          break;
        case 'next':
          nprNext();
          break;
        case 'rewind':
          nprRewind();
          break;
        case 'like':
          nprLike();
          break;
      }
      socket.emit('npr status', player.status);
    });
  },

  like: function(socket){
    nprSocket = socket;
    socket.on('npr like', function(data){
      rec.recordAction(nprSDK.Action.THUMBUP, player.status.position);
    });
  },

  getRecommendations: function(socket){
    nprSocket = socket;
    socket.on('get npr recommendations', function(data){
      started = true;
      async.series([
        getAccessToken,
        getRecommendations
      ]);
    });
  },

  cancel: function(){
    player.pause();
  }
};

function getAccessToken(cb){
  if(accessToken){
    cb(null, accessToken);
  } else {
    User.find({}, function(err, users){
      if(err){
        console.log('error grabbing token');
        res.sendStatus(401);
      } else {
        accessToken = users[0].npr_token;
        nprSDK.config = {
          accessToken: accessToken,
          authProxyBaseUrl: 'http://localhost:3000/auth/npr'
        };

        console.log('got npr token.', nprSDK.config);
        cb(null, accessToken);
        //return accessToken;
      }
    });
  }
}

function getRecommendations(cb){
  console.log('about to get sdk rec');
  nprOne.getRecommendation()
    .then(playRec)
    .catch(function(err){
      console.log('error getting npr recommendations:', err);
    });
}

function playRec(recommendation){
  rec = recommendation;
  var href = recommendation.getAudio()[0].href;
  if(href.includes('https')){
    href = href.replace('https', 'http');
  }
  recommendation.recordAction(nprSDK.Action.START, 0);

  player.openFile(href);

  player.status.title = rec.attributes.title;
  player.status.started = started;

  if(nprSocket){
    nprSocket.emit('npr status', player.status);
  }

  console.log('npr play rec:', rec.attributes.title);
}

function nprNext(){
  console.log('next story');
  player.seekPercent(100);
}

function nprRewind(){
  var pos = player.status.position - 15;
  if(pos < 0){
    pos = 0;
  }
  player.seek(pos);
}

function nprPlay(){
  player.status.playing ? player.pause() : player.play();
  controls.cancelOther('npr');
}

function nprLike(){
  rec.recordAction(nprSDK.Action.THUMBUP, player.status.position);
}
