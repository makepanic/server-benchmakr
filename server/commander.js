var cp = require('child_process'),
	sys = require('sys');

var Commander = function(cfg, finished){
	this.cfg = cfg;
	this.commands = [];
	this.step = 0;
	this.applications = 0;
	this.finished = finished;
	this.done = {};
	this.child = null;

	this._buildCommands();
};
Commander.prototype = {
	_buildCommands : function(){
		for(var i = 0, max = this.cfg.length; i < max; i++){

			var test = this.cfg[i];
			for(var j = 0, maxJ = test['tests'].length; j < maxJ; j++){
				var item = test['tests'][j];
				var cmd = {
					command: test['command'],
					params: [test['directory'] + '/' + item['file']]
				};
				this.commands.push(cmd);
			}
		}
	},
	getCurrent: function(){
		return {
			app: {
				'application' : this.cfg[this.applications]['application'],
				'directory' : this.cfg[this.applications]['directory']
			},
			commands: this.getCurrentCommand()
		}
	},
	getNextCommand: function(){
		if(this.step + 1 < this.commands.length){
			return this.commands[this.step + 1];
		}else{
			return {};
		}
	},
	getCurrentCommand: function(){
		return this.commands[this.step];
	},
	getCommands: function(){
		return this.commands;
	},
	reset: function(){
		this.step = 0;
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
		if(this.step + 1 <= this.commands.length){
			this._exec();
		}else{
			if(this.application + 1 <= this.cfg.length){
				this.application++;
				this.step = 0;
				this.next(done);
			}else{
				console.log('no remaining commands and applications, calling done');
				this.done(this.step == this.commands.length);				
			}
		}
	},
	_exec: function(){
		var app = this.cfg[this.applications],
			test = app['tests'][this.step],
			command = {
				'command' : app['command'],
				'params' : [app['directory'] + '/' + test['file']]
			},
			child,
			that = this;

		this.step++;

		var fullCommand = command.command + ' ' + command.params.join(' ');
		console.log('[ Commander: ' + this.step + '/' + this.commands.length + ' ] ' + fullCommand);

		this.child = cp.spawn(command.command, command.params);
		this.child.on('close', function(code){
			console.log('child process terminated code:' + code);
			that.done(this.step == that.commands.length);
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