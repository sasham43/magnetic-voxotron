var router = require('express').Router();
var request = require('request');
var nprSDK = require('npr-one-sdk').default;
var npr = require('./auth.js').npr;

var nprPlay = function(recommendation){
  recommendation.recordAction(npr.Action.START, 0);

  var audio = recommendation.getAudio()[0];
  console.log('audio:', audio);
}

router.get('/go', function(req, res){
  console.log('npr is going', npr);
  npr.getRecommendation()
    .then(nprPlay)
    .catch(function(err) {
        console.log('failure while playing: ', err);
    });;
});

module.exports = router;
