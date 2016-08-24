require('dotenv').config();
var express = require('express');
var bodyParser = require('body-parser');
var http = require('http');
var mongoose = require('mongoose');
var path = require('path');
var passport = require('passport');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
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

// database
var mongoURI = 'mongodb://localhost/magnetic-voxotron';
var mongoDB = mongoose.connect(mongoURI).connection;

mongoDB.on('error', function(err){
  console.log('Error connecting to database:', err);
});

mongoDB.once('open', function(){
  console.log('Connected to database.');
});

// auth routes
var auth = require('./modules/auth.js').router;
var npr = require('./modules/npr.js');

app.use('/auth', auth);
app.use('/npr', npr);

app.get('/', routes.index);
app.get('/*', routes.index);

// start listening
server.listen(port, function(){
  console.log('Server listening on port ' + port + '...');
});
