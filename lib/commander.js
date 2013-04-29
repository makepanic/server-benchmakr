var red = '\u001b[31m',
	blue = '\u001b[34m',
	reset = '\u001b[0m';

var cp = require('child_process'),
	sys = require('sys'),
	Q = require('./q.min.js');

if(Q){
	console.info('included Q');
}else{
	console.error('Q not found');
	return;
}

var Commander = function(cfg, finished){
	this.cfg = cfg;

	this.currentTest = 0;
	this.currentApplication = 0;

	this.applications = [];

	this.ready = true;
	this.finished = finished;
	this.done = {};

	this.child = null;
	this.procEnvStart = null;
	this.procEnvStop = null;

	this._buildIndex();
	this._before = null;
	this._after = null;

	this.init('start');
};
Commander.prototype = {
	_spawn: function(store ,cmd){
		this[store] = cp.spawn('sh', cmd);
		this[store].on('close', function(code){
			console.log('[' + store + '] process terminated, code:' + code);
			done()
		});
		this[store].stdout.on('data', function (data) {
		  console.log('[' + store + '] stdout: ' + data);
		});
		this[store].stderr.on('data', function (data) {
		  console.log('[' + store + '] stderr: ' + data);
		});
	},
	init: function(what){
		var app = this.getCurrentApplication();
		console.log('[init] app = ', app['application']);
		switch(what){
			case 'start':
				if(app['start'].length){
					this._spawn('procEnvStart', app['start']);
				}else{
					console.log('[start] no command, skipping');
				}
			break;
			case 'stop':
				if(app['stop'].length){
					this._spawn('procEnvStart', app['stop']);
				}else{
					console.log('[stop] no command, skipping');
				}
			break;
		}
	},
	before: function(fn){
		this._before = function(){
			var deferred = Q.defer();

			fn.call(this, function(){
				deferred.resolve('_before');
			});

			return deferred.promise;
		};
		return this;
	},
	after: function(fn){
		this._after = function(){
			var deferred = Q.defer();

			fn.call(this, function(){
				deferred.resolve('_after');
			});

			return deferred.promise;
		};
		return this;
	},
	_promotion: function(){
		this.ready = true;
		console.log('Commander promoted to', this.type);
		return this;
	},
	promoteClient: function(){
		this.type = 'CLIENT';
		return this._promotion();
	},
	promoteServer: function(){
		this.type = 'SERVER';
		return this._promotion();
	},
	_buildIndex : function(){
		console.log('building index');
		for(var i = 0, max = this.cfg.length; i < max; i++){
			this.applications.push(this.cfg[i]);
		}
		console.log('applications:', this.applications.length);
	},
	getCfg: function(){
		return this.cfg;
	},
	getCurrentApplication: function(){
		return this.applications[this.currentApplication];
	},
	getCurrentTest: function(){
		var app = this.getCurrentApplication();
		return app['tests'][this.currentTest];
	},
	getCurrent: function(){
		return {
			'test': this.getCurrentTest(),
			'application': this.getCurrentApplication()
		}
	},
	getCurrentApplicationTestLength: function(){
		return this.getCurrentApplication()['tests'].length;
	},
	run: function(){

		var that = this;
		var hasTests = this.currentTest + 1 <= this.getCurrentApplicationTestLength();
		var hasApplications = this.currentApplication + 1 < this.applications.length;
		
		console.log('currentTest', this.currentTest);
		console.log('currentApplication', this.currentApplication);
		console.log('applications', this.applications.length);
		console.log('applicationsTests', this.getCurrentApplicationTestLength());
		console.log('hasTests', hasTests);
		console.log('hasApplications', hasApplications);
		
		if(hasTests || hasApplications){
		//while(hasTests || hasApplications){
			console.log('has Applications || hasTests');

			this._before()
			.then(function(){
				return that.next()
			})
			.then(function(){
				return that._after()
			})
			.then(function(){
				return that.stop()
			})
			.then(function(){
				return that.finished(true);	
			}, function(err){
				console.error(err);
			}).done();

		}else{
			console.log('no remaining tests, shutting down');
			if(this.finished){
				this.finished(false)
			}else{
				process.exit(0);				
			}
		}

		return this;
	},
	_stepDone: function(){
		this.stop();
	},
	reset: function(){
		this.currentTest = 0;
		this.currentApplication = 0;

		this.init('stop');
		return this;
	},
	stop: function(){
		var deferred = Q.defer();

		if(this.child){
			console.log('stopping commander child');
			this.child.kill();
			setTimeout(function(){
				deferred.resolve('stop');
			}, 500);
		}else{
			console.log('Cant stop. No child process running.');
		}

		return deferred.promise;
	},
	next: function(done){
		var deferred = Q.defer();

		console.log('commander.next', this.currentTest);

		this.done = done;
		if(this.currentTest + 1 <= this.getCurrentApplicationTestLength()){
			this._exec(function(){
				deferred.resolve('next');
			});
		}else{
			if(this.currentApplication + 1 < this.applications.length){
				this.currentApplication++;
				this.currentTest = 0;
				this.next(done);
			}else{
				console.log('no remaining commands and applications, calling done');
				this.done(this.currentTest == this.getCurrentApplicationTestLength());				
			}
		}

		return deferred.promise;
	},
	_exec: function(done){
		var command;
		var app = this.getCurrentApplication(),
			test = this.getCurrentTest(),
			child,
			that = this;

		switch(this.type){
			case 'CLIENT':
				command = {
					'command' : 'sh',
					'params' : ['pylot_1.26/bench.sh', '-t', app['application'], '-f', test['name']]
				};
				break;
			case 'SERVER':
				command = {
					'command' : app['command'],
					'params' : [app['directory'] + '/' + test['file']]
				};
				break;
		}

		this.currentTest++;

		var fullCommand = command.command + ' ' + command.params.join(' ');
		
		//output
		console.log(red + '[ Commander: application ' + (this.currentApplication + 1) + '/' + this.applications.length + '\t]' + reset);
		console.log(blue + '[ Commander: test        ' + this.currentTest + '/' + this.getCurrentApplicationTestLength() + '\t] ' + reset);
		console.log(reset + '\t' + fullCommand + '\n');

		this.child = cp.spawn(command.command, command.params);
		
		this.child.on('close', function(code){
			console.log('child process terminated code:' + code);
			done()
		});

		this.child.stdout.on('data', function (data) {
		  console.log('stdout: ' + data);
		});

		this.child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

	},
	done: function(){
		finished(true);
	}
};
module.exports = Commander;