module.exports = function(grunt){
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    copy: {
      main: {
        expand: true,
        cwd: 'node_modules/',
        src: [
          'angular/angular.min.js',
          'angular/angular.min.js.map',
          'angular-route/angular-route.min.js',
          'angular-route/angular-route.min.js.map',
          'skeleton-css/css/skeleton.css',
          'font-awesome/css/font-awesome.min.css',
          'font-awesome/fonts/fontawesome-webfont.svg',
          'font-awesome/fonts/fontawesome-webfont.eot',
          'font-awesome/fonts/fontawesome-webfont.ttf',
          'font-awesome/fonts/fontawesome-webfont.woff',
          'font-awesome/fonts/fontawesome-webfont.woff2',
          'socket.io-client/socket.io.js'
        ],
        dest: 'server/public/vendor'
      }
    },
    watch: {
      scripts: {
        files: ['client/client.js'],
        tasks: ['uglify', 'copy'],
        options: {
          spawn: false,
        },
      },
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      build: {
        src: 'client/client.js',
        dest: 'server/public/scripts/client.min.js'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s)
  grunt.registerTask('default', ['copy', 'uglify']);
}
