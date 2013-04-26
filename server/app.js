var cfg = {
	benchCfgFile: 'bench-cfg.json',
	lockfile: './.lock',
	ports: {
		socket: 9000
	}
};

var fs = require('fs'),
	io = require('socket.io').listen(cfg.ports.socket),
    Commander = require('../lib/commander.js');

fs.readdir('.', function (err, files) {
  var benchmarks = [];
    if (err) {
        throw err;
    }
    for(var i = 0, max = files.length; i < max; i++){
      var file = files[i];

      var stat = fs.statSync(file);
      if(stat && stat.isDirectory()){
        if(fs.existsSync(file + '/bench-cfg.json')){
          
          var fullPath = __dirname + '/' + file + '/' + 'bench-cfg.json';
        
          var cfg = fs.readFileSync(fullPath, {
            'encoding' : 'UTF-8'
          });

          benchmarks.push(JSON.parse(cfg));
        }
      }
    }

    if(benchmarks.length){
      //boot socket & commander if benchmarks exists
      boot(benchmarks);
    }
});

var hasLock = function(locked, unlocked){
	fs.exists(cfg.lockfile, function(exists) {
	  if (exists) {
	  	locked();
	  } else {
	  	unlocked()
	  }
	});
};

var boot = function(benchmarks){
	var status = {
		SUCCESS: 'success',
		FAILURE: 'failure',
		PASS: 'pass',
  		DONE: 'done'
	};

	var lock = function(){
		fs.openSync(cfg.lockfile, 'w');
	};
	var unlock = function(){
		fs.unlinkSync(cfg.lockfile);
	};

	var slave = new Commander(benchmarks, function(){
		unlock();
		console.log('commander finished');
	}).promoteServer();

	io.sockets.on('connection', function (socket) {
		console.log('connection');

		socket.on('ping',function(user){
			if(slave.ready){
		    	io.sockets.emit('pong', { 
		    		status: status.SUCCESS, 
		    		data: slave.getCfg()
		    	});				
			}else{
		    	io.sockets.emit('pong', { 
		    		status: status.DONE, 
		    	});								
			}
	  	});

	  	socket.on('start', function (data) {
			console.log('[io] start');

			var locked = function(){
				io.sockets.emit('status', { 
		    		type: 'start',
		    		status: status.PASS
		    	});
			};
			var unlocked = function(){

				//create lockfile
				lock();

				//code
				slave.next(function(noCommandLeft){
					if(noCommandLeft){
						//no command left
						console.log('no commands left');
						slave.ready = false;
					}else{
						//has commands left
					}
				});

				//return status
				io.sockets.emit('status', { 
		    		type: 'start',
		    		status: status.SUCCESS
		    	});
			};

			hasLock(locked, unlocked);
		});

		socket.on('stop', function (data) {
			console.log('[io] stop');

			var locked = function(){

				//remove lockfile in the end
				slave.stop();
				unlock();

				io.sockets.emit('status', { 
		    		type: 'stop',
		    		status: status.SUCCESS
		    	});
			};
			var unlocked = function(){
				io.sockets.emit('status', { 
		    		type: 'stop',
		    		status: status.PASS
		    	});
			};

			hasLock(locked, unlocked);

		});
		socket.on('reset', function (data) {
			console.log('[io] reset');

			var locked = function(){

				io.sockets.emit('status', { 
		    		type: 'reset',
		    		status: status.PASS
		    	});

			};
			var unlocked = function(){

				slave.reset();
				io.sockets.emit('status', { 
		    		type: 'reset',
		    		status: status.SUCCESS
		    	});
			};

			hasLock(locked, unlocked);
		});
		socket.on('test', function(data){
			console.log('test', data);
		});
	});

};




/*var express = require('express'),
	http = require('http'),
	io = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = io.listen(server);

var messages = {
	'host': 'localhost',
	'server.locked': 'Server locked.',
	'server.unlocked': 'Server unlocked.',
	'doing.nothing': 'Doing nothing.',
	'commander.call': 'Calling commander.',
	'commander.stop': 'Stopping commander.',
	'commander.reset': 'Resetting commander.',
	'commander.run': 'Running commander'
};

var cfg = {
	benchCfgFile: 'bench-cfg.json',
	lockfile: './.lock',
	ports: {
		index: 8000,
	}
};

app.configure(function(){
  app.set('port', cfg.ports.index);
  app.use(express.favicon());
  app.use(express.logger('dev'));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


var ns = io.of('/ns');
io.sockets.on('connection', function (socket) {
	console.log('connection via socket');
	
	setTimeout(function(){
		io.sockets.emit('hello', { status: 'success' });
		socket.emit('hello', {status: 'success'});
	},1000);

	socket.on('start', function (data) {
		console.log('[io] start');
		socket.emit('start', { status: 'success' });
	});
	socket.on('stop', function (data) {
		console.log('[io] stop');
	});
	socket.on('reset', function (data) {
		console.log('[io] reset');
	});
	socket.on('test', function(data){
		console.log('test', data);
	});
});

server.listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});

//server.listen(cfg.ports.socket);
/*
var p = ".";
fs.readdir(p, function (err, files) {
	var benchmarks = [];
    if (err) {
        throw err;
    }
    for(var i = 0, max = files.length; i < max; i++){
    	var file = files[i];

    	var stat = fs.statSync(file);
    	if(stat && stat.isDirectory()){
    		if(fs.existsSync(file + '/bench-cfg.json')){
    			
    			var fullPath = __dirname + '/' + file + '/' + 'bench-cfg.json';
				
    			var cfg = fs.readFileSync(fullPath, {
    				'encoding' : 'UTF-8'
    			});

    			benchmarks.push(JSON.parse(cfg));
    		}
    	}
    }

    if(benchmarks.length){
    	console.log('has benchmarks');
    	boot(benchmarks);
    }
});



var boot = function(benchmarks){
	console.log('booting benchmark server router');

	var slave = new Commander(benchmarks, function(){
		unlock();
		console.log('commander finished');
	});


	var lock = function(){
		fs.openSync(cfg.lockfile, 'w');
	};
	var unlock = function(){
		fs.unlinkSync(cfg.lockfile);
	};

	var hasLock = function(locked, unlocked){
		fs.exists(cfg.lockfile, function(exists) {
		  if (exists) {
		  	locked();
		  } else {
		  	unlocked()
		  }
		});
	};

	http.createServer(function(req, res){

		var locked = function(){
			console.log(messages['server.locked'] + messages['doing.nothing']);

		  	res.writeHead(204);
		  	res.end();
		};
		var unlocked = function(){
			console.log(messages['server.unlocked'] + messages['commander.call']);

			//create lockfile
			lock();

			//code
			slave.next(function(noCommandLeft){
				if(noCommandLeft){
					//no command left
				}else{
					//has commands left
				}
			});

			//return current command
	  		res.writeHead(200, {'Content-Type': 'application/json'});
	  		res.end(JSON.stringify(slave.getCurrent()));	

		};
		
		hasLock(locked, unlocked);

	}).listen(cfg.ports.startServer);

	http.createServer(function(req, res){
		console.log('connection at stop server');
		
		var locked = function(){
			console.log(messages['server.locked'] + messages['commander.stop']);

			//remove lockfile in the end
			slave.stop();
			unlock();

		  	res.writeHead(200, {'Content-Type': 'text/plain'});
		  	res.end(messages['commander.stop']);
		};
		var unlocked = function(){
			console.log(messages['server.locked'] + messages['doing.nothing']);
		  	res.writeHead(204);
		  	res.end();
		};
		
		hasLock(locked, unlocked);

	}).listen(cfg.ports.stopServer);

	http.createServer(function(req, res){
		console.log('connection at stop server');
		
		var locked = function(){
			console.log(messages['server.locked'] + messages['doing.nothing']);
		  	res.writeHead(204);
		  	res.end();
		};
		var unlocked = function(){
			console.log(messages['server.unlocked'] + messages['commander.reset']);
			slave.reset();
		  	res.writeHead(200);
		  	res.end(messages['commander.reset']);
		};
		
		hasLock(locked, unlocked);

	}).listen(cfg.ports.resetServer);

	http.createServer(function(req, res){
		var response = slave ? slave.getCurrent() : {};

		console.log('connection at getCommands server');
		
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(response));

	}).listen(cfg.ports.getCommands);

	console.log('[start] ' + messages['host'] + ':' + cfg.ports.startServer);
	console.log('[stop ] ' + messages['host'] + ':' + cfg.ports.stopServer );
	console.log('[reset] ' + messages['host'] + ':' + cfg.ports.resetServer);
	console.log('[plan ] ' + messages['host'] + ':' + cfg.ports.getCommands);
}
*/