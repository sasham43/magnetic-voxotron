var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');
var io = require('../server.js').io;
var fs = require('fs');
var Mplayer = require('mplayer');
var async = require('async');
var player = new Mplayer();

var accessToken = '';
var recs = [];
var recsPayload = {};
var count = 0;
var storyArray = [];
var playing = false;
var filename = './server/tmp/npr.pls';

player.on('stop', function(){
  console.log('story over, playing next.', recsPayload);

  if(!recsPayload.items[count].attributes.rating.rating){
    recsPayload.items[count].attributes.rating.rating = "COMPLETED";
  }

  async.series([
    getAccessToken,
    postRecommendations
  ]);

  // if(!accessToken){
  //   getAccessToken(postRecommendations);
  // } else {
  //   postRecommendations();
  // }

  count++;
  player.status.story = storyArray[count];
});

var nprModule = {};

nprModule.emitStatus = function(socket){
  socket.on('get npr status', function(data){
    socket.emit('npr status', player.status);
  });
};

nprModule.openPlaylist = function(socket){
  socket.on('go', openPlaylist);
};

nprModule.command = function(socket){
  socket.on('npr command', function(data){
    console.log('npr command:', data.cmd);
    switch(data.cmd){
      case 'play':
        player.status.playing ? player.pause() : player.play();
        break;
      case 'pause':
        player.pause();
        break;
      case 'next':
        // next
        player.seekPercent(100);
        break;
      case 'rewind':
        // rewind
        var pos = player.status.position - 15;
        if(pos < 0){
          pos = 0;
        }
        player.seek(pos);
        break;
    }
    socket.emit('npr status', player.status);
  });
};

nprModule.like = function(socket){
  socket.on('npr like', function(data){
    recsPayload.items[count].rating.rating = "THUMBSUP";
  });
};

nprModule.getRecommendations = function(socket){
  console.log('getting npr recommendations');
  socket.on('get npr recommendations', function(data){
    User.find({}, function(err, users){
      if(err){
        console.log('Error grabbing token');
        res.sendStatus(401);
      } else {
        console.log('Got npr token');
        accessToken = users[0].npr_token;

        // get recommendations
        var options = {
          url: 'https://api.npr.org/listening/v2/recommendations?channel=npr',
          headers: {
            "Accept": "application/json",
            "Authorization": "Authorization=Bearer " + accessToken
          }
        };

        ////////////////
        request(options, function(err, response, body){
          if(err){
            console.log('Error getting recommendations:', err);
            res.sendStatus(400);
          } else {
            console.log('Got NPR recommendations.');
            body = JSON.parse(body); // parse response
            recsPayload = body;
            recs = body.items;

            // run through and grab all links
            recs.map(function(story){
              var title = '';
              if(story.attributes.title){
                title = story.attributes.title;
              }
              var tmp = {
                href: story.links.audio[0].href,
                type: story.links.audio[0]['content-type'],
                title: title // include the story's title if there is one
              }
              storyArray.push(tmp);
            });
            writePLSFile(filename, storyArray);
            // res.send(body);
            socket.emit('npr recommendations', recsPayload);
          }
        });
        ///////////////
      }
    });
  })
};

module.exports = nprModule;

function writePLSFile(filename, arr){
  var plsString = '[playlist]\n';
  arr.map(function(story, index){
    plsString += 'File' + index + '=' + story.href + '\n'
      + 'Title' + index + '=' + story.title + '\n\n';
  });
  plsString += 'NumberOfEntries=' + arr.length + 1;

  fs.writeFile(filename, plsString, function(err){
    console.log('wrote pls file.');
    openPlaylist();
  });
}

function openPlaylist(){
  console.log('wrote pls file', player);
  player.openPlaylist(filename, {
      cache: 128,
      cacheMin: 1,
      pause: 0
  });
  player.status.story = storyArray[0];
}

function getAccessToken(cb){
  if(accessToken){
    cb(null, accessToken);
  } else {
    User.find({}, function(err, users){
      if(err){
        console.log('Error grabbing token');
        res.sendStatus(401);
      } else {
        console.log('Got npr token');
        accessToken = users[0].npr_token;
        cb(null, accessToken);
        //return accessToken;
      }
    });
  }
}

function postRecommendations(cb){
  var options = {
    type: 'POST',
    url: 'https://api.npr.org/listening/v2/ratings?',
    headers: {
      "Accept": "application/json",
      "Authorization": "Authorization=Bearer " + accessToken
    },
    json: true,
    body: recsPayload
  };

  request(options, function(err, response, body){
    if(err){
      console.log('error posting recommendations:', err);
      cb(err);
    } else {
      console.log('posted recommendations');
      cb(null);
    }
  });
}

// function
