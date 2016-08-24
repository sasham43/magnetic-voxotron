var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');
var wget = require('wget-improved');
var Mplayer = require('mplayer');
var mplayer = new Mplayer();

var accessToken = '';
var recs = [];
var recCount = 0;
var destArray = [];

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
          body = JSON.parse(body);
          // data.items.links.audio[0].href
          recs = body.items;
          console.log('Got NPR recommendations.');
          startDownloading(recCount);
          res.send(body);
        }
      });
    }
  });
});

function startDownloading(count){
  var file = recs[count];
  var extension = '';
  var filename = file.attributes.uid;
  switch(file.links.audio[0]['content-type']){
    case 'audio/aac':
      extension = '.mp4';
      break;
    case 'audio/mp3':
      extension = '.mp3';
      break;
    default:
      extension = '.mp4';
  }
  var dest = './server/tmp/' + filename + extension;
  destArray.push(dest); // save to array for player

  var options = {
    dest: './server',
    url: file.links.audio[0].href,
    timeout: 2000
  }

  wget.download(options.url, dest)
    .on('error', function(){
      if(err) console.log('error getting file:', err);
    })
    .on('end', function(){
      console.log('got file');
      // play file
      recCount++;
      if(recCount < 7){
        startDownloading(recCount);
      } else {
        console.log('downloaded recommendations get more');
        recCount = 0;
      }
    });
}

module.exports = router;
