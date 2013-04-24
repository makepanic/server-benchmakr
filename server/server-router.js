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
	benchCfgFile: 'bench-cfg.json',
	lockfile: './.lock',
	ports: {
		startServer: 9001,
		stopServer: 9002,
		resetServer: 9003,
		getCommands: 9004
	}
};

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
		console.log('connection at getCommands server');
		
		res.writeHead(200, {"Content-Type": "application/json"});
		res.end(JSON.stringify(slave.getCurrentCommand()));

	}).listen(cfg.ports.getCommands);

	console.log('[start] ' + messages['host'] + ':' + cfg.ports.startServer);
	console.log('[stop ] ' + messages['host'] + ':' + cfg.ports.stopServer );
	console.log('[reset] ' + messages['host'] + ':' + cfg.ports.resetServer);
	console.log('[plan ] ' + messages['host'] + ':' + cfg.ports.getCommands);
}