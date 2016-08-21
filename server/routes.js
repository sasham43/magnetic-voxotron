var router = require('express').Router();
var path = require('path');

module.exports = {
  index: function(req, res){
    res.sendFile(path.join(__dirname, '../server/public/views/index.html'));
  }
}
