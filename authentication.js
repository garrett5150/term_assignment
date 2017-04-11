var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParse = require('body-parser');
var http = require('http');
var indexrouter = express.Router();
var mongoDB = require('app.js');
var querystring = require('querystring');

app.use(express.static("themes"));
app.use(express.static("public"));
app.use(bodyParse.urlencoded({extended:false}));

mongoDB.connect( function( ) {

} );

app.post('/authenticateUser', function(req,res) {

var db = mongoDB.getDB();
var username = req.body.username;
var password = req.body.password;


db.collection('user').find({name:username, pwd:password}).toArray(function(error, documents) {

  var authResponse = {
    "token":"False",
    "userID":"False"
  };

  if(documents.length > 0){

    // req.session.token = "true";
    // req.session.userID = documents[0].userID;
    //console.log(req.session.userID);
    
    authResponse = {
      "token":"True",
      "userID":documents[0].userID
    };

    res.send(authResponse);

  }
  else{
    res.send(authResponse);
  }
 //res.send(documents);
});

});

var server = app.listen(3001, function () {
    var host = server.address();
    var port = server.address().port;
    console.log("Server Started at http://localhost:%s", port);
});
