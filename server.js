var express = require('express');
// var connect = require('connect');
var request = require('request');
var fs = require('fs');

var app = express();

app.get('/lines.json', function(req, res) {
    fs.readdir(__dirname + "/static/lines", function(err, files) {
        res.writeHead(200, { 'Content-Type': "application/json" });
        res.write(JSON.stringify(files));
        res.end();
    });
});

// app.use(connect.compress());
app.use(express.static(__dirname + "/static"));
app.listen(parseInt(process.env.PORT || "8000", 10), '::');
