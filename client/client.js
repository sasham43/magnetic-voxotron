angular.module('MagVoxApp', ['ngRoute']);

var socket = io();

angular.module('MagVoxApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $routeProvider
    .when('/', {
      templateUrl: '/views/splash.html',
      controller: 'NowPlayingController',
      controllerAs: 'npc'
    })
    .when('/spotify', {
      templateUrl: '/views/spotify.html',
      controller: 'SpotifyController',
      controllerAs: 'sc'
    })
    .when('/cd', {
      templateUrl: '/views/cd.html',
      controller: 'CDController',
      controllerAs: 'cc'
    })
    .when('/npr', {
      templateUrl: '/views/npr.html',
      controller: 'NPRController',
      controllerAs: 'nc'
    })
    .when('/settings', {
      templateUrl: '/views/settings.html',
      controller: 'SettingsController',
      controllerAs: 'setc'
    })

    $locationProvider.html5Mode(true);
}]);

angular.module('MagVoxApp').controller('IndexController', ['$http', function($http){
  var ic = this;

  ic.openNav = function(){
    ic.showNav = !ic.showNav;
  };

  ic.hideNav = function(){
    ic.showNav = false;
  };

  console.log('index controller loaded.');
}]);

angular.module('MagVoxApp').controller('NowPlayingController', ['$http', 'NowPlayingFactory', function($http, NowPlayingFactory){
  var npc = this;

  npc.nprPlaying = NowPlayingFactory.nprPlaying;
  npc.spotifyPlaying = NowPlayingFactory.spotifyPlaying;
  npc.cdPlaying = NowPlayingFactory.cdPlaying;

  npc.currentService = '';
  if(npc.nprPlaying){
    npc.currentService = 'NPR';
  }
  if(npc.spotifyPlaying){
    npc.currentService = 'Spotify';
  }
  if(npc.cdPlaying){
    npc.currentService = 'CD';
  }
  if(!npc.nprPlaying && !npc.spotifyPlaying && !npc.cdPlaying){
    npc.currentService = 'Nothing Selected';
  }

  console.log('now playing controller loaded.');
}]);

angular.module('MagVoxApp').controller('SpotifyController', ['$http', '$scope', 'NowPlayingFactory', function($http, $scope, NowPlayingFactory){
  var sc = this;

  sc.playlistNames = [];
  sc.showPlaylistContainer = true;
  sc.playing = false;

  sc.togglePlaylistContainer = function(){
    sc.showPlaylistContainer = !sc.showPlaylistContainer;
  };

  sc.cmd = function(cmd){
    console.log('spotify command:', cmd);
    socket.emit('spotify command', cmd);
  };

  sc.selectPlaylist = function(index){
    socket.emit('spotify select playlist', {index: index});
  };

  socket.on('spotify status', function(data){
    console.log('spotify status', data);
    $scope.$apply(function(){
      sc.playlistNames = data.playlistNames;
    });
  });

  socket.on('spotify playlist', function(data){
    console.log('spotify playlist', data);
  });

  sc.status = function(){
    console.log('getting spotify status');
    socket.emit('get spotify status');
  };

  sc.status();

  console.log('spotify controller loaded.');
}]);

angular.module('MagVoxApp').controller('NPRController', ['$http', '$scope', 'NowPlayingFactory', function($http, $scope, NowPlayingFactory){
  var nc = this;

  nc.playing = false;
  NowPlayingFactory.nprPlaying = nc.playing;
  nc.story = {};

  socket.on('connected', function(data){
    console.log('socket connected.');
  });

  socket.on('disconnected', function(data){
    console.log('socket disconnected.');
  });

  socket.on('npr status', function(data){
    console.log('npr status:', data);
    $scope.$apply(
      nc.playing = data.playing,
      nc.story = data.story
    );
  });

  socket.on('npr recommendations', function(data){
    console.log('npr recommendations:', data);
  });

  nc.go = function(){
    // $http.get('/npr/go').then(function(response){
    //   console.log('npr recs:', response);
    //   socket.emit('go'); // start playing
    // }).then(function(response){
    //   //console.log('npr go fail:', response);
    // });
    socket.emit('get npr recommendations');
  };

  nc.cmd = function(cmd){
    socket.emit('npr command', {cmd: cmd});
    console.log('npr command:', cmd);
  };

  nc.status = function(){
    socket.emit('get npr status');
  };

  nc.like = function(){
    socket.emit('npr like');
  };

  // get recommendations
  //nc.go();
  console.log('npr controller loaded.');
}]);

angular.module('MagVoxApp').controller('CDController', ['$http', function($http){
  console.log('cd controller loaded.');
}]);

angular.module('MagVoxApp').controller('SettingsController', ['$http', function($http){
  console.log('settings controller loaded.');
}]);

angular.module('MagVoxApp').factory('NowPlayingFactory', ['$http', function($http){
  var nprPlaying = false;
  var spotifyPlaying = false;
  var cdPlaying = false;

  return {
    nprPlaying: nprPlaying,
    spotifyPlaying: spotifyPlaying,
    cdPlaying: cdPlaying
  }
}]);
