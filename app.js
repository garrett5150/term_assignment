var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParse = require('body-parser');
var http = require('http');
var indexrouter = express.Router();
app.use(express.static("themes"));

app.use('/', indexrouter);
indexrouter.route('/').get(function (req, res) {
    var fn = __dirname + '/index.html';
    res.sendFile(fn);
});

var server = app.listen(3000, function () {
    var host = server.address();
    var port = server.address().port;
    console.log("Server Started at http://localhost:%s", port);
});
