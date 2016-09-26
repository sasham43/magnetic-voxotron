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

  // npc.nprPlaying = NowPlayingFactory.nprPlaying;
  // npc.spotifyPlaying = NowPlayingFactory.spotifyPlaying;
  // npc.cdPlaying = NowPlayingFactory.cdPlaying;

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
    // more sockets here
    
    // if(npc.nprPlaying){
    //   npc.currentService = 'NPR';
    // }
    // if(npc.spotifyPlaying){
    //   npc.currentService = 'Spotify';
    // }
    // if(npc.cdPlaying){
    //   npc.currentService = 'CD';
    // }
    // if(!npc.nprPlaying && !npc.spotifyPlaying && !npc.cdPlaying){
    //   npc.currentService = 'Nothing Selected';
    // }
    // console.log('current service:', npc.currentService, NowPlayingFactory.spotifyPlaying);
  };

  npc.checkService();

  console.log('now playing controller loaded.');
}]);

angular.module('MagVoxApp').controller('SpotifyController', ['$http', '$scope', function($http, $scope){
  var sc = this;

  sc.playlistNames = [];
  sc.trackList = [];
  sc.showPlaylistContainer = true;
  sc.showTrackList = false;
  sc.trackNumber = 0;
  sc.playing = false;

  // NowPlayingFactory.spotifyPlaying = sc.playing;

  // sc.togglePlaylistContainer = function(){
  //   sc.showPlaylistContainer = !sc.showPlaylistContainer;
  // };

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

  socket.on('spotify status', function(data){
    console.log('spotify status', data);
    $scope.$apply(function(){
      sc.playlistNames = data.playlistNames;
      sc.trackList = data.trackList;
      sc.trackNumber = data.trackNumber;
      // NowPlayingFactory.spotifyPlaying = data.playing;
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

angular.module('MagVoxApp').controller('NPRController', ['$http', '$scope', function($http, $scope){
  var nc = this;

  nc.playing = false;
  // NowPlayingFactory.nprPlaying = nc.playing;
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
      // NowPlayingFactory.nprPlaying = nc.playing
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
  console.log('settings controller loaded.');
}]);

// angular.module('MagVoxApp').factory('NowPlayingFactory', ['$http', function($http){
//   var nprPlaying = false;
//   var spotifyPlaying = false;
//   var cdPlaying = false;
//
//   return {
//     nprPlaying: nprPlaying,
//     spotifyPlaying: spotifyPlaying,
//     cdPlaying: cdPlaying
//   }
// }]);
