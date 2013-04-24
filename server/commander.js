var cp = require('child_process'),
	sys = require('sys');

var Commander = function(cfg, finished){
	this.cfg = cfg;

	this.currentTest = 0;
	this.currentApplication = 0;

	this.applications = [];

	this.finished = finished;
	this.done = {};
	this.child = null;

	this._buildIndex();
};
Commander.prototype = {
	_buildIndex : function(){
		for(var i = 0, max = this.cfg.length; i < max; i++){
			this.applications.push(this.cfg[i]);
		}
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
	reset: function(){
		this.currentTest = 0;
		this.currentApplication = 0;
	},
	stop: function(){
		if(this.child){
			console.log('stopping commander child');
			this.child.kill();
		}else{
			console.log('Cant stop. No child process running.');
		}
	},
	next: function(done){
		this.done = done;
		if(this.currentTest + 1 <= this.getCurrentApplicationTestLength()){
			this._exec();
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
	},
	_exec: function(){
		var app = this.getCurrentApplication(),
			test = this.getCurrentTest(),
			command = {
				'command' : app['command'],
				'params' : [app['directory'] + '/' + test['file']]
			},
			child,
			that = this;

		this.currentTest++;

		var fullCommand = command.command + ' ' + command.params.join(' ');
		console.log('[ Commander: application: ' + (this.currentApplication + 1) + '/' + this.applications.length + '\t]');
		console.log('[ Commander: test:        ' + this.currentTest + '/' + this.getCurrentApplicationTestLength() + '\t] ' + fullCommand);

		this.child = cp.spawn(command.command, command.params);
		this.child.on('close', function(code){
			console.log('child process terminated code:' + code);
			that.done(that.currentTest == that.getCurrentApplicationTestLength());
		});
		this.child.stdout.on('data', function (data) {
		  console.log('stdout: ' + data);
		});

		this.child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

	},
	done: function(){
		finished();

	}
};
module.exports = Commander;