var http = require('http'),
    mongodb = require('mongodb');

var serverOptions = {
};

var serv = new mongodb.Server('localhost', 27017, serverOptions);
var dbManager = dbManager = new mongodb.Db('tests', serv);
var c;
var connection = dbManager.open(function(err, conn){
		if(err){
		console.log('open error');
		}	
		c = conn;
		});
var onConnection = function(err, conn){

};

http.createServer(function(req, res){

		c.collection('tests', function(err, coll){
			if(err)
			console.log('mongo collection error');
			coll.find(function(err, cursor){
				res.writeHead(200, {'Content-Type' : 'text/plain'});
				var out = [];
				cursor.each(function(err, test){
					if(test){
					out.push(['<li>', test['name'], '</li>'].join(''));
					}else{
					res.write(out.join(''));
					res.end('\n');
					}
					});
				if(err)
				console.log('find toarray error');
				});
			});
}).listen(1340);

console.log('server running at localhost:1340');
