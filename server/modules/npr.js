var router = require('express').Router();
var request = require('request');
var User = require('../models/userModel');

var accessToken = '';

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
          // data.items.links.audio[0].href
          console.log('Got NPR recommendations.', body);
          res.send(body);
        }
      });
    }
  });
});

module.exports = router;
