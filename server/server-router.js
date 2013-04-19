var http = require('http'),
	fs = require('fs'),
	Commander = require('./commander.js');

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
	lockfile: './.lock',
	ports: {
		startServer: 9001,
		stopServer: 9002,
		resetServer: 9003
	}
};

var commands = [{
	params: [],
	command: 'pwd'
},{
	params: ['-la'],
	command: 'ls'
},{
	params: ['-u'],
	command: 'date'
}];

var slave = new Commander({

}, commands, function(){
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
				res.writeHead(204);
				res.end();
			}else{
		  		res.writeHead(200, {'Content-Type': 'text/plain'});
		  		res.end(messages['commander.run']);	
			}
		});

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

console.log('[start] ' + messages['host'] + ':' + cfg.ports.startServer);
console.log('[stop ] ' + messages['host'] + ':' + cfg.ports.stopServer);
console.log('[reset] ' + messages['host'] + ':' + cfg.ports.resetServer);
