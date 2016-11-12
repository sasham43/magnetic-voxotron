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
  sc.trackList = [];
  sc.showAlbumContainer = true;
  sc.showTrackList = false;
  sc.trackNumber = 0;
  sc.playing = false;

  socket.on('spotify status', function(data){
    console.log('spotify status', data);
    $scope.$apply(function(){
      sc.albums = data.albums;
      sc.trackList = data.trackList;
      sc.trackNumber = data.trackNumber;
    });
  });

  socket.on('spotify albums', function(data){
    $scope.$apply(function(){
      sc.albums = data.albums
    });
      console.log('spotify albums:', sc.albums);
  });

  sc.cmd = function(cmd, track){
    console.log('spotify command:', cmd);
    socket.emit('spotify command', {cmd: cmd, track: track});
  };

  sc.selectAlbum = function(index){
    socket.emit('spotify select album', {index: index});
    sc.showAlbumContainer = false;
    sc.showTrackList = true;
  };

  sc.back = function(){
    sc.showTrackList = false;
    sc.showAlbumContainer = true;
  };

  sc.status = function(){
    console.log('getting spotify status...');
    socket.emit('get spotify status');
  };

  sc.status();
  // socket.emit('spotify update albums');
  socket.emit('spotify get albums');

  console.log('spotify controller loaded.');
}]);

angular.module('MagVoxApp').directive('mvAlbum', function(){
  return {
    restrict: 'E',
    scope: {
      album: '=album'
    },
    templateUrl: '/views/mv-album.html'
  };
});

angular.module('MagVoxApp').directive('mvTrack', function(){
  return {
    restrict: 'E',
    templateUrl: '/views/mv-track.html'
  };
});

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
  var cc = this;

  cc.cmd = function(cmd){
  console.log('cd command:', cmd);
    socket.emit('cd command', {cmd:cmd});
  };

  console.log('cd controller loaded.');
}]);

angular.module('MagVoxApp').controller('SettingsController', ['$http', function($http){
  var setc = this;

  setc.updateSpotify = function(){
    socket.emit('spotify update albums');
  };

  console.log('settings controller loaded.');
}]);
