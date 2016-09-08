var spotifyCancel = require('./spotify.js');
var nprCancel = require('./npr.js').cancel;

var cancelOthers = function(service){
  console.log('cancelling other services:', this);
  if(service !== 'spotify'){
    spotifyCancel();
  }
  if(service !== 'npr'){
    nprCancel();
  }
};
exports.cancelOther = cancelOthers;
