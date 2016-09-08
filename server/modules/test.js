var spotifyCancel = require('./spotify.js');

module.exports = function(){
  console.log('testing 123:', this.spotifyModule.cancel);
};
