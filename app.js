var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParse = require('body-parser');
var http = require('http');
var indexrouter = express.Router();
var mongoDB = require('app.js');

app.use(express.static("themes"));
app.use(express.static("public"));
app.use(bodyParse.urlencoded({extended:false}));

app.use(session({
  secret: "supersecretcode",
  cookie:{maxAge:20 * 60 * 1000},
  resave:false,
  saveUninitialized:false
}));

app.use('/', indexrouter);
indexrouter.route('/').get(function (req, res) {
    var fn = __dirname + '/login.html';
    res.sendFile(fn);
});

mongoDB.connect( function( ) {

} );

indexrouter.route('/index').get(function (req, res) {
    var fn = __dirname + '/index.html';
    res.sendFile(fn);
});


app.post('/listCourses', function(req,res){

   var db = mongoDB.getDB();


   db.collection('courses').find({}).toArray(function(error, documents) {

    res.send(documents);
  });

});

app.post('/addCourse', function(req,res) {

  var db = mongoDB.getDB();
  var name = req.body.courseName;
  db.collection('courses').insert({course:name});

});

app.post('/removeCourse', function(req,res){

  var db = mongoDB.getDB();
  var name = req.body.courseName;
  db.collection('courses').remove({course:name});

});

app.post('/login', function(req,res){

  var db = mongoDB.getDB();
  var username = req.body.un;
  var password = req.body.pw;

  db.collection('user').find({name:username, pwd:password}).toArray(function(error, documents) {

    if(documents.length > 0){
      req.session.token = "true";
      req.session.userID = documents[0].userID;
      //console.log(req.session.userID);
      res.send('http://localhost:3000/index');

    }
    else{
      res.send('http://localhost:3000/error');
    }
   //res.send(documents);
  });



});


app.get('/studentpage', function(req,res)
{
  var fn=__dirname + '/public/' + 'student.html'
  console.log(fn);
  res.sendFile(fn);
})


app.post('/displayUserInfo', function(req,res){
  var id = req.session.userID;
  var db = mongoDB.getDB();
  db.collection('user').find({userID:id}).toArray(function(error,documents) {
    //console.log(documents[0].name);
    res.send(documents[0].name);
  });


});

app.post('/logout', function(req,res) {
  req.session = null;
  res.send('http://localhost:3000');
});

var server = app.listen(3000, function () {
    var host = server.address();
    var port = server.address().port;
    console.log("Server Started at http://localhost:%s", port);
});
