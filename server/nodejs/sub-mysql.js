var http = require('http'),
        mysql = require('mysql');

var connection = mysql.createConnection({
        host : 'localhost',
        user : 'root',
        password : 'root',
        database : 'testdb'
});
connection.connect(function(err){
        if(err)console.log('Error while connecting');
});

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

                connection.query('SELECT r1.id, r1.value FROM testselect AS r1 JOIN(SELECT (RAND() * (SELECT MAX(id) FROM testselect)) AS id) AS r2 WHERE r1.id >= r2.id ORDER BY r1.id ASC LIMIT 1;', function(err, rows, fields){
                        if(err)throw err;
                        var out = [];
                        for(var i = 0, max = rows.length; i < max; i++){
                                var item = rows[i];
                                out.push(['<p>', item.id, ' - ', item.value, '</p>'].join(''));
                        }
                        res.writeHead(200, {'Content-Type' : 'text/html'});
                        res.end(out.join(''));
                });
        }).listen(1352);

console.log('server running at localhost:1352');


