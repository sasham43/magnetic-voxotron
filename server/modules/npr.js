var router = require('express').Router();
var request = require('request');
var nprSDK = require('npr-one-sdk').default;
var npr = require('../server.js').npr;
var User = require('../models/userModel');

npr.onAccessTokenChanged = function (newToken) {
    console.log('Access token has changed! New token:', newToken);
    // in production, replace console.log() with code to update your token in memory/localStorage/wherever
};

var nprPlay = function(recommendation){
  recommendation.recordAction(npr.Action.START, 0);

  var audio = recommendation.getAudio()[0];
  console.log('audio:', audio);
}

router.get('/go', function(req, res){
  // find token
  User.find({}, function(err, user){
    if(err){
      console.log('error getting npr token', err);
    } else {
      console.log('got npr token', user);
      // npr.config = {
      //   accessToken: "gPdaRkYhVQOhBum16aqoQidnRybIpgoFv2H9gjwl"
      // }
      // npr.accessToken = "gPdaRkYhVQOhBum16aqoQidnRybIpgoFv2H9gjwl";

    }
  })

});

module.exports = router;
