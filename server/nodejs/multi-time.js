var http = require('http');
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var port = parseInt(process.argv[2], 10);


if(cluster.isMaster){
	for(var i = 0; i < numCPUs; i++){
		cluster.fork();
	}
	cluster.on('exit', function(worker, code, signal){
		cluster.fork();
	});
}else{

	http.createServer(function(req, res){
		res.writeHead(200, {'Content-Type': 'text/plain'});

		var now = new Date();

		res.end('' + Math.floor(now.getTime()/1000));
	}).listen(8001);

}
console.log('multi: server running on port 8001');
