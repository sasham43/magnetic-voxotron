var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');
var io = require('../server.js').io;
var fs = require('fs');
var Mplayer = require('mplayer');
var player = new Mplayer();

var accessToken = '';
var recs = [];
var count = 0;
var storyArray = [];
var playing = false;

router.get('/go', function(req, res){
  // get access token
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

      request(options, function(err, response, body){
        if(err){
          console.log('Error getting recommendations:', err);
          res.sendStatus(400);
        } else {
          console.log('Got NPR recommendations.');
          body = JSON.parse(body); // parse response
          recs = body.items;

          // run through and grab all links
          recs.map(function(story){
            var tmp = {
              href: story.links.audio[0].href,
              type: story.links.audio[0]['content-type'],
              title: story.attributes.title ? story.attributes.title : '' // include the story's title if there is one
            }
            storyArray.push(tmp);
          });
          writePLSFile('./server/tmp/npr.pls', storyArray);
          res.send(body);
        }
      });
    }
  });
});

player.on('stop', function(){
  console.log('story over, playing next.');
});

// player.once('start', function(){
//   //player.stop();
// });



io.on('connection', function(socket){
  var emitStatus = function(data){
      playing = player.status.playing;
      console.log('status:', player._events);
      socket.emit('status', player.status);
  };

  socket.on('error', function(err){
    console.log('socket error:', err);
  });

  console.log('socket connected.');
  socket.emit('connected');

  // player.on('status', function(){
  //   console.log('status change!!!!\n', player.status)
  //   if(player.status.playing === playing){
  //     emitStatus();
  //   }
  // });

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
    emitStatus();
  });

  //socket.on('get status', emitStatus);
});

function writePLSFile(filename, arr){
  var plsString = '[playlist]\n';
  arr.map(function(story, index){
    plsString += 'File' + index + '=' + story.href + '\n'
      + 'Title' + index + '=' + story.title + '\n\n';
  });
  plsString += 'NumberOfEntries=' + arr.length + 1;

  fs.writeFile(filename, plsString, function(err){
    console.log('wrote pls file', player);
    player.openPlaylist(filename, {
        cache: 128,
        cacheMin: 1,
        pause: 0
    });
  });
}

module.exports = router;
