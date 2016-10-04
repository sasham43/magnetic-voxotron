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

angular.module('MagVoxApp').controller('IndexController', ['$http', '$location', function($http, $location){
  var ic = this;

  // new nav
  ic.nav = function(href){
    $location.url(href);
  };

  console.log('index controller loaded.');
}]);

angular.module('MagVoxApp').controller('NowPlayingController', ['$http', '$scope', function($http, $scope){
  var npc = this;

  npc.currentService = '';

  socket.on('spotify status', function(data){
    $scope.$apply(
      npc.spotifyPlaying = data.playing
    );
    npc.setText();
  });

  socket.on('npr status', function(data){
    $scope.$apply(
      npc.nprPlaying = data.playing
    );
    npc.setText();
  });

  npc.setText = function(){
    // console.log('setting text: NPR | Spotify | CD ', npc.nprPlaying, npc.spotifyPlaying, npc.cdPlaying);
    if(npc.nprPlaying){
      $scope.$apply(function(){
          npc.currentService = 'NPR'
        }
      );
    }
    if(npc.spotifyPlaying){
      $scope.$apply(function(){
          npc.currentService = 'Spotify'
        }
      );
    }
    if(npc.cdPlaying){
      npc.currentService = 'CD';
    }
    if(!npc.nprPlaying && !npc.spotifyPlaying && !npc.cdPlaying){
      $scope.$apply(function(){
          npc.currentService = 'Nothing Selected'
        }
      );
    }
  };

  npc.checkService = function(){
    socket.emit('get npr status');
    socket.emit('get spotify status');
  };

  npc.checkService();

  console.log('now playing controller loaded.');
}]);

angular.module('MagVoxApp').controller('SpotifyController', ['$http', '$scope', function($http, $scope){
  var sc = this;

  sc.playlistNames = [];
  sc.albumNames = [];
  sc.artistNames = [];
  sc.trackList = [];
  sc.showBase = true;
  sc.showPlaylistContainer = false;
  sc.showAlbumContainer = false;
  sc.showArtistContainer = false;
  sc.showTrackList = false;
  sc.trackNumber = 0;
  sc.playing = false;

  sc.loader = function(){
    return sc.playlistNames.length == 0;
  };

  sc.back = function(){
    sc.showTrackList = false;
    sc.showPlaylistContainer = true;
  };

  sc.cmd = function(cmd){
    console.log('spotify command:', cmd);
    socket.emit('spotify command', cmd);
  };

  sc.selectPlaylist = function(index){
    socket.emit('spotify select playlist', {index: index});
    sc.showPlaylistContainer = false;
    sc.showTrackList = true;
  };

  sc.selectAlbum = function(index){
    socket.emit('spotify select album', {index: index});
    sc.showAlbumContainer = false;
    sc.showTrackList = true;
  };

  sc.select = function(str){
    sc.showBase = false;
    switch(str){
      case 'playlists':
        sc.showPlaylistContainer = true;
        break;
      case 'albums':
        sc.showAlbumContainer = true;
        break;
      case 'artists':
        sc.showArtistContainer = true;
        break;
    }
  };

  socket.on('spotify status', function(data){
    console.log('spotify status', data);
    $scope.$apply(function(){
      sc.playlistNames = data.playlistNames;
      sc.trackList = data.trackList;
      sc.trackNumber = data.trackNumber;
    });
  });

  socket.on('spotify playlist', function(data){
    console.log('spotify playlist', data);
  });

  socket.on('spotify albums', function(data){
    console.log('spotify albums:', data);
    $scope.$apply(function(){
      sc.albumNames = data.albumNames
    });
  });

  sc.status = function(){
    console.log('getting spotify status');
    socket.emit('get spotify status');
  };

  sc.status();
  // socket.emit('spotify update albums');
  socket.emit('spotify get albums');

  console.log('spotify controller loaded.');
}]);

angular.module('MagVoxApp').controller('NPRController', ['$http', '$scope', function($http, $scope){
  var nc = this;

  nc.playing = false;
  nc.title;

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
      nc.title = data.title,
      nc.started = data.started
    );
  });

  socket.on('npr recommendations', function(data){
    console.log('npr recommendations:', data);
  });

  nc.go = function(){
    if(nc.started){
      nc.cmd('play');
    } else {
      socket.emit('get npr recommendations');
    }
  };

  nc.cmd = function(cmd){
    socket.emit('npr command', {cmd: cmd});
    console.log('npr command:', cmd);
  };

  nc.status = function(){
    socket.emit('get npr status');
  };

  // get status
  nc.status();
  console.log('npr controller loaded.');
}]);

angular.module('MagVoxApp').controller('CDController', ['$http', function($http){
  console.log('cd controller loaded.');
}]);

angular.module('MagVoxApp').controller('SettingsController', ['$http', function($http){
  var setc = this;

  setc.updateSpotify = function(){
    socket.emit('spotify update albums');
  };

  console.log('settings controller loaded.');
}]);
