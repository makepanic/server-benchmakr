var http = require('http');

http.createServer(function(req, res){
	res.writeHead(200, {'Content-Type': 'text/plain'});
	
	var now = new Date();

	res.end('' + Math.floor(now.getTime()/1000));
}).listen(8000);

console.log('server running on port 8000');

