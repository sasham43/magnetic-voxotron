var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');
var fs = require('fs');
var Mplayer = require('mplayer');
var player = new Mplayer();

var accessToken = '';
var recs = [];
var count = 0;
var storyArray = [];

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
          //startPlaying();
          res.send(body);
        }
      });
    }
  });
});

function startPlaying(){
  console.log('storyArray:', storyArray);
  player.openFile(storyArray[count].href);
  player.play();
  count++;
}

player.on('stop', function(){
  console.log('story over, playing next.');
});

function writePLSFile(filename, arr){
  var plsString = '[playlist]\n';
  arr.map(function(story, index){
    plsString += 'File' + index + '=' + story.href + '\n'
      + 'Title' + index + '=' + story.title + '\n';
  });
  plsString += 'NumberOfEntries=' + arr.length + 1;

  fs.writeFile(filename, plsString, function(err){
    console.log('wrote pls file', err);
    player.openPlaylist(filename, {
        cache: 128,
        cacheMin: 1
    });
    player.play();
  });
}

module.exports = router;
