var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: String,
  npr_token: String,
  npr_refresh: String,
  spotify_token: String,
  spotify_refresh: String,
  spotify_albums: [{
    album_name: String,
    artist_name: String,
    album_tracks:[{track_name: String, index: Number, uri: String}],
    album_uri: String,
    album_images: {big: String, med: String, sml: String}}]
});

var User = mongoose.model('User', userSchema);

module.exports = User;
