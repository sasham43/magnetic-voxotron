var cp = require('child_process');

var cdSocket;
var child;
var trackNumber = 0;

var gpio = require('onoff').Gpio;
var buttonPlay = new gpio(17, 'in', 'both');
var buttonPrev = new gpio(27, 'in', 'both');
var buttonNext = new gpio(18, 'in', 'both');
var buttonEject = new gpio(23, 'in', 'both');

buttonPlay.watch(function(err, value) {
  console.log('button play press:', value, err);
  if(value === 1){
    controls.play();
  }
});

buttonPrev.watch(function(err, value) {
  console.log('button prev press:', value, err);
  if(value === 1){
    controls.prevTrack();
  }
});

buttonNext.watch(function(err, value) {
  console.log('button next press:', value, err);
  if(value === 1){
    controls.nextTrack();
  }
});

buttonEject.watch(function(err, value) {
  console.log('button eject press:', value, err);
  if(value === 1){
    controls.eject();
  }
});


var play = function(data){
  console.log('play');
  var args = ['-track', trackNumber];
  var options = { cwd: undefined, env: process.env };
  // console.log('process.env.PATH:', process.env.PATH );
  if(child){
    child.stdin.write('q', errorLog);
  } else {
    // console.log('track=' + trackNumber + ' cdplayer.sh');
    child = cp.spawn('cdplayer.sh', args, options).on('error', function( err ){ throw err });
  }
  child.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });
  child.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });
  child.on('close', function(code) {
    console.log('closing code: ' + code);
    child = undefined;
  });
};

var prevTrack = function(data){
  console.log('prev');
  if(child){
    child.stdin.write('<', errorLog);
    trackNumber--;
  }
};

var nextTrack = function(data){
  console.log('next');
  if(child){
    child.stdin.write('>', errorLog);
    trackNumber++;
  }
};

var eject = function(data){
  console.log('eject');
  if(child){
    child.stdin.write('q', function(){
      cp.exec('eject /dev/cdrom', errorLog);
    });
  } else {
    cp.exec('eject /dev/cdrom', errorLog);
  }
  trackNumber = 0;
};


function errorLog(error){
  if(error){
    console.log('error writing to child.stdin:', error);
  }
}

module.exports = cdModule = {
  command: function(socket){
    cdSocket = socket;

    socket.on('cd command', function(data){
      switch(data.cmd){
        case 'play':
          play();
          break;
        case 'next':
          nextTrack();
          break;
        case 'prev':
          prevTrack();
          break;
        case 'eject':
          eject();
          break;
        default:
          console.log('unrecognized command.');
      }
    });
  }
}
