var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: String,
  npr_token: String,
  npr_refresh: String
});

var User = mongoose.model('User', userSchema);

module.exports = User;
