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
var recsObject = {};
var recsRatings = [];
var count = 0;
var storyArray = [];
var playing = false;
var skipped = false;
var filename = './server/tmp/npr.pls';

var nprSocket;

player.on('stop', function(){
  console.log('story over, playing next.');

  if(skipped){
    skipped = false;
    recsRatings[count].elapsed = Number(player.status.position);
    recsRatings[count].rating = "SKIP";
  } else {
    recsRatings[count].elapsed = recsRatings[count].duration;
    recsRatings[count].rating = "COMPLETED";
  }

  async.series([
    getAccessToken,
    postRecommendations
  ]);

  count++;
  player.status.count = count;
  player.status.story = storyArray[count];
  if(nprSocket){
    // wait one second to allow mplayer status to update it self -- yes this sucks
    setTimeout(function(){
      console.log('emitting status...');
      nprSocket.emit('npr status', player.status);
    }, 1000);
  }
});

var nprModule = {};

nprModule.emitStatus = function(socket){
  nprSocket = socket;
  socket.on('get npr status', function(data){
    socket.emit('npr status', player.status);
  });
};

nprModule.openPlaylist = function(socket){
  nprSocket = socket;
  socket.on('go', openPlaylist);
};

nprModule.command = function(socket){
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
};

nprModule.like = function(socket){
  nprSocket = socket;
  socket.on('npr like', function(data){
    recsRatings[count].elapsed = Number(player.status.position);
    recsRatings[count].rating = "THUMBUP";
    async.series([
      getAccessToken,
      postRecommendations
    ]);
  });
};

nprModule.getRecommendations = function(socket){
  nprSocket = socket;
  socket.on('get npr recommendations', function(data){
    async.series([
      getAccessToken,
      getRecommendations
    ]);
  });
};

module.exports = nprModule;

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
  //console.log('wrote pls file', player);
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
        console.log('error grabbing token');
        res.sendStatus(401);
      } else {
        console.log('got npr token.');
        accessToken = users[0].npr_token;
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

  request(options, function(err, response, body){
    if(err){
      console.log('error posting recommendations:', err);
      cb(err);
    } else {
      // console.log('posted recommendations.', body);
      // body = JSON.parse(body);
      recsObject = body;
      recs = body.items;

      // run through and grab all links
      storyArray = [];
      recs.map(function(story){
        recsRatings.push(story.attributes.rating);
        var title = '';
        if(story.attributes.title){
          title = story.attributes.title;
        }
        var href = story.links.audio[0].href;
        if(href.includes('https')){
          href = href.replace('https', 'http');
        }
        var tmp = {
          href: href,
          type: story.links.audio[0]['content-type'],
          title: title // include the story's title if there is one
        }
        if(story.attributes.rating.rating === 'START'){
          storyArray.push(tmp);
        }
      });
      writePLSFile(filename, storyArray);
      // res.send(body);
      //nprSocket.emit('npr recommendations', recsObject);

      if(nprSocket){
        nprSocket.emit('npr recommendations', recsRatings);
      }
      cb(null);
    }
  });
}

function getRecommendations(cb){
  var options = {
    url: 'https://api.npr.org/listening/v2/recommendations?channel=npr',
    headers: {
      "Accept": "application/json",
      "Authorization": "Authorization=Bearer " + accessToken
    }
  };

  request(options, function(err, response, body){
    if(err){
      console.log('error getting npr recommendations:', err);
      res.sendStatus(400);
      cb(err);
    } else {
      console.log('got NPR recommendations.');
      body = JSON.parse(body); // parse response
      recsObject = body;
      recs = body.items;

      // run through and grab all links
      recs.map(function(story){
        recsRatings.push(story.attributes.rating);
        var title = '';
        if(story.attributes.title){
          title = story.attributes.title;
        }
        var href = story.links.audio[0].href;
        if(href.includes('https')){
          href = href.replace('https', 'http');
        }
        var tmp = {
          href: href,
          type: story.links.audio[0]['content-type'],
          title: title // include the story's title if there is one
        }
        storyArray.push(tmp);
      });
      writePLSFile(filename, storyArray);
      // res.send(body);
      nprSocket.emit('npr recommendations', recsObject);
      cb(null);
    }
  });
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
}
