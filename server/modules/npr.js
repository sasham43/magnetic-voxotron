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

var accessToken = '';
var recs = [];
var recsObject = {};
var recsRatings = [];
var count = 0;
var storyArray = [];
var playing = false;
var skipped = false;
var filename = './server/tmp/npr.pls';

var nprSocket;

player.on('status', function(){
  if(nprSocket){
    nprSocket.emit('npr status', player.status);
  }
});

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
      socket.emit('npr status', player.status);
    });
  },

  openPlaylist: function(socket){
    nprSocket = socket;
    socket.on('go', openPlaylist);
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
      }
      socket.emit('npr status', player.status);
    });
  },

  like: function(socket){
    nprSocket = socket;
    socket.on('npr like', function(data){
      recsRatings[count].elapsed = Number(player.status.position);
      recsRatings[count].rating = "THUMBUP";
      async.series([
        getAccessToken,
        postRecommendations
      ]);
    });
  },

  getRecommendations: function(socket){
    nprSocket = socket;
    socket.on('get npr recommendations', function(data){
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

function writePLSFile(filename, arr){
  var plsString = '[playlist]\n';
  var arrCount = arr.length + 1;
  arr.map(function(story, index){
    index++;
    plsString += 'File' + index + '=' + story.href + '\n'
      + 'Title' + index + '=' + story.title + '\n\n';
  });
  plsString += 'NumberOfEntries=' + arrCount;

  fs.writeFile(filename, plsString, function(err){
    console.log('wrote pls file.');
    openPlaylist();
  });
}

function openPlaylist(){
  console.log('about to get rec sdk');
  nprOne.getRecommendation()
    .then(function(recommendation){
      console.log('npr sdk rec:', recommendation);
    });
  // //console.log('wrote pls file', player);
  // player.openPlaylist(filename, {
  //     cache: 128,
  //     cacheMin: 1,
  //     pause: 0
  // });
  // player.status.story = storyArray[0];
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

function postRecommendations(cb){
  var options = {
    method: 'POST',
    url: 'https://api.npr.org/listening/v2/ratings?channel=npr&recommend=true',
    headers: {
      "Accept": "application/json",
      "Authorization": "Authorization=Bearer " + accessToken
    },
    json: true,
    body: JSON.stringify(recsRatings)
  };

  if(nprSocket){
    nprSocket.emit('npr recommendations', recsRatings);
  }
  console.log('recsRatings', recsRatings);

  request(options, function(err, response, body){
    if(err){
      console.log('error posting recommendations:', err);
      if(cb){
        cb(err);
      }
    } else {
      recsObject = body;
      recs = body.items;

      if(nprSocket){
        nprSocket.emit('npr recommendations', body);
      }
      if(cb){
        cb(null);
      }
    }
  });
}

function getRecommendations(cb){
  // var nprOne = new nprSDK();
  console.log('about to get sdk rec');
  nprOne.getRecommendation()
    .then(playRec)
    // .then(playRec)
    // .then(playRec)
    // .then(playRec)
    // .then(playRec)
    // .then(playRec)
    // .then(playRec)
    // .then(playRec)
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

  console.log('npr play rec:', href);


}

function nprNext(){
  console.log('next story:', count+1, storyArray.length);
  if((count + 1) < storyArray.length){
    skipped = true;
    player.seekPercent(100);
  } else {
    async.series([
      getAccessToken,
      getRecommendations
    ]);
  }
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
