var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var mongoose = require('mongoose');
var path = require('path');
var routes = require('./routes');

var app = express();

// set up server
var server = http.Server(app);
var port = process.env.PORT || 3000;

// express config
app.use(express.static('server/public'));
app.use(bodyParser.json());

app.get('/', routes.index);

app.get('/*', routes.index);

// start listening
server.listen(port, function(){
  console.log('Server listening on port ' + port + '...');
})
