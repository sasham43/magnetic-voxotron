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
var spotifyModule = require('./modules/spotify.js');
var nprModule = require('./modules/npr.js');
var cdModule = require('./modules/cd.js');

// test
// require('./modules/test.js')();

var app = express();

// set up server & socket
var server = http.Server(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

console.log('start');

io.on('connection', function(socket){
  socket.on('error', function(err){
    console.log('socket error:', err);
  });
  console.log('socket connected.');
  nprModule.emitStatus(socket);
  nprModule.command(socket);
  nprModule.getRecommendations(socket);

  spotifyModule.emitStatus(socket);
  spotifyModule.command(socket);
  spotifyModule.playlistSelect(socket);
  spotifyModule.albumSelect(socket);
  spotifyModule.updateAlbums(socket);
  spotifyModule.getAlbums(socket);

  cdModule.command(socket);
});

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
  console.log('error connecting to database:', err);
});

mongoDB.once('open', function(){
  console.log('connected to database.');
});

// auth routes
var auth = require('./modules/auth.js').router;
// var npr = require('./modules/npr.js');

app.use('/auth', auth);
// app.use('/npr', npr);
// app.use('/spotify', spotify);

app.get('/', routes.index);
app.get('/*', routes.index);

// start listening
server.listen(port, function(){
  console.log('server listening on port ' + port + '...');
});
