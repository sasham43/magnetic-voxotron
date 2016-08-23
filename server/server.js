require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var mongoose = require('mongoose');
var path = require('path');
var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var routes = require('./routes');

var app = express();

// set up server
var server = http.Server(app);
var port = process.env.PORT || 3000;

// express config
app.use(express.static('server/public'));
app.use(bodyParser.json());
app.use(cookieParser());
//express session
app.use(session({
  secret: 'teal walls',
  resave: true,
  saveUninitialized: false,
  cookie: {maxAge: 3600000, secure: false}
}));
app.use(passport.initialize());
app.use(passport.session());

// auth routes
var auth = require('./modules/auth.js');

app.use('/auth', auth);

// temp auth routes
app.get('/success', function(req, res){
  res.send('success');
});

app.get('/failure', function(req, res){
  res.send('failure');
});

app.get('/', routes.index);
app.get('/*', routes.index);

// start listening
server.listen(port, function(){
  console.log('Server listening on port ' + port + '...');
})
