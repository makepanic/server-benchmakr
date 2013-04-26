var io = require('socket.io-client'),
    Commander = require('../lib/commander.js'),
    serverUrl = 'http://localhost:9000';


var status = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  PASS: 'pass',
  DONE: 'done'
};

var options ={
  ready: false,
  transports: ['websocket'],
  'force new connection': true
};

var slave = null;
var socket = io.connect(serverUrl, options);

socket.on('connect', function(){
  console.log('connected to socket');
  socket.emit('ping');

  socket.on('pong', function(data){
    console.log('got pong');
    if(data.status === status.SUCCESS && data.data){

      console.log('successfully connected to server');

      options.ready = true;
      slave = new Commander(data.data, function(){

        socket.emit('ping');

        console.log('commander finished');
      }).promoteClient();

      slave.before(function(done){
        console.log('slave.before');
        socket.emit('start');

        setTimeout(function(){
          done();
        }, 1000);

      }).after(function(done){

        console.log('slave.after');
        socket.emit('stop');

        setTimeout(function(){
          done();
        }, 1000);

      });

      slave.run();
    }
  });

  socket.on('status', function(data){
    console.log('server status', data);
  });

});

socket.on('disconnect', function(data){
  console.log('disconnected');
});
