angular.module('MagVoxApp', ['ngRoute']);

angular.module('MagVoxApp').config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
  $routeProvider
    .when('/', {
      templateUrl: '/views/splash.html',
      controller: 'SplashController',
      controllerAs: 'splashc'
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

    $locationProvider.html5Mode(true);
}]);

angular.module('MagVoxApp').controller('IndexController', ['$http', function($http){
  console.log('index controller loaded.');
}]);

angular.module('MagVoxApp').controller('SplashController', ['$http', function($http){
  console.log('splash controller loaded.');
}]);

angular.module('MagVoxApp').controller('SpotifyController', ['$http', function($http){
  console.log('spotify controller loaded.');
}]);

angular.module('MagVoxApp').controller('NPRController', ['$http', function($http){
  console.log('npr controller loaded.');
}]);

angular.module('MagVoxApp').controller('CDController', ['$http', function($http){
  console.log('cd controller loaded.');
}]);
