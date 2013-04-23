var cp = require('child_process'),
	sys = require('sys');

var Commander = function(cfg, commands, finished){
	this.cfg = cfg;
	this.commands = commands;
	this.step = 0;
	this.finished = finished;
	this.done = {};
	this.child = null;
};
Commander.prototype = {
	getCommands: function(){
		return JSON.stringify(this.commands);
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
			console.log('no remaining commands, calling done');
			this.done(this.step == this.commands.length);
		}
	},
	_exec: function(){
		var command = this.commands[this.step],
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