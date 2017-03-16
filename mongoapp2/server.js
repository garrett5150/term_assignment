var express = require('express');
var app = express();
var mongoDB = require('app.js');
var bodyParse = require('body-parser');



app.use(bodyParse.urlencoded({extended:false}));

mongoDB.connect( function( ) {

} );




app.get('/', function(req,res) {

  res.sendFile(__dirname + '/index.html');

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

app.listen(300, function () {

  console.log("supyo");

});
