var http = require('http'),
        mysql = require('mysql'),
        cluster = require('cluster'),
        numCPUs = require('os').cpus().length;

var connection = mysql.createConnection({
        host : 'localhost',
        user : 'root',
        password : 'root',
        database : 'testdb'
});
connection.connect(function(err){
        if(err)console.log('Error while connecting');
});

if(cluster.isMaster){
        for(var i = 0; i < numCPUs; i++){
                cluster.fork();
        }
        cluster.on('exit', function(worker, code, signal){
                cluster.fork();
        });
}else{
        http.createServer(function(req, res){
        /*
                var items = [];
                while(items.length < 1000){
                        var item = {id : null, value : 'item ' + items.length};
                        items.push(item);
                        connection.query('INSERT INTO testselect SET ?', item , function(err, result){
                                if(err){console.log(err);}      
                        });
                }       
        */

                var time = 10000 + (Math.random() * 100 | 0);
                connection.query('SELECT * FROM testselect WHERE id <' + time, function(err, rows, fields){
                        if(err)throw err;
                        var out = [];
                        for(var i = 0, max = rows.length; i < max; i++){
                                var item = rows[i];
                                out.push(['<p>', item.id, ' - ', item.value, '</p>'].join(''));
                        }
                        res.writeHead(200, {'Content-Type' : 'text/html'});
                        res.end(out.join(''));
                });
        }).listen(1343);
}

console.log('server running at localhost:1343');

