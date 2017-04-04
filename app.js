var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParse = require('body-parser');
var http = require('http');
var indexrouter = express.Router();
var mongoDB = require('app.js');

function getNextSequence(name) {
  var db = mongoDB.getDB();
   var ret = db.collection('counter').findAndModify(

            {_id:name},
            [],
            { $inc: { seq: 1 } },
            {new:true},
            function(err,doc) {
              console.log(doc);
            }

   );

   //return ret.seq;
}

app.use(express.static("themes"));
app.use(express.static("public"));
app.use(bodyParse.urlencoded({extended:false}));

app.use(session({
  secret: "supersecretcode",
  cookie:{maxAge:20 * 60 * 1000 * 100 * 100},
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
    if(req.session.token == "true"){
      res.sendFile(fn);
    }
    else{
      res.send('http://localhost:3000/error');
    }
});


app.post('/listCourses', function(req,res){

   var db = mongoDB.getDB();
   var id = req.session.userID;

   var courseIDs = [];
   var courseList = [];
    db.collection('user_course').find({userID:id}).toArray(function(error, documents) {
      //console.log(documents);
      for(i=0;i<documents.length;i++){
        courseIDs[i] = documents[i].courseID;
      }
        //console.log(documents[i].courseID);
        db.collection('course').find({courseID: {$in: courseIDs} }).toArray(function(err,doc) {

          //console.log(doc);
          res.send(doc);

        });

  });

});

app.post('/addCourse', function(req,res) {

  var db = mongoDB.getDB();
  var id = req.session.userID;
  var name = req.query.courseName;



  // db.collection('course').insert({course_Name:name, teacherID: id, userID: id, courseID: getNextSequence("courseID")}, function(error,documents){
  //   console.log(documents);
  // });
  // db.collection('counter').find({}).toArray(  function(err,doc){
  //   console.log(doc);
  // });
  db.collection('counter').update({_id:"_courseID"},  { $inc: { seq: 1} } );

  db.collection('counter').find({_id:"_courseID"}).toArray(function(err,doc){
    db.collection('course').insert({course_Name:name, teacherID: id, userID: id, courseID: doc[0].seq});
    db.collection('user_course').insert({courseID:doc[0].seq, studentID: id, userID: id});
  });





});

app.post('/removeCourse', function(req,res){

  var db = mongoDB.getDB();
  var name = req.body.courseName;
  db.collection('courses').remove({course:name});

});

app.post('/addUser', function(req,res) {
  var db = mongoDB.getDB();
  var username = req.body.name;
  var password = req.body.pw;
  var isStudent = req.body.isStudent;

  //console.log("add user:" + username + " | " + isStudent);

  db.collection('user').find({name:username}).toArray(function(error, documents) {
    //console.log(documents.length);
    if (documents.length > 0){
      res.redirect("/signup?un=true");
    }
    else {
      db.collection('counter').update({_id:"_userID"},  { $inc: { seq: 1} } );
      db.collection('counter').find({_id:"_userID"}).toArray(function(err,doc){
        if (isStudent==1){
          db.collection('user').insert({userID:doc[0].seq, name:username, isStudent:'true', isTeacher:'false', pwd:password});
        }
        else {
          db.collection('user').insert({userID:doc[0].seq, name:username, isStudent:'false', isTeacher:'true', pwd:password});
        }
      });


      res.redirect("/?un=false");
    }
  });
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

app.get('/signup', function(req, res){
  var signup_page = __dirname + '/public/signup.html';
  console.log(signup_page);
  res.sendFile(signup_page);
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
    console.log(documents[0].name);
    res.send(documents[0].name);
  });


});

app.post('/logout', function(req,res) {
  req.session.token = null;
  res.send('http://localhost:3000');
});

app.get('/error', function (req,res){
  var fn=__dirname + '/error.html'
  console.log(fn);
  res.sendFile(fn);
});


var server = app.listen(3000, function () {
    var host = server.address();
    var port = server.address().port;
    console.log("Server Started at http://localhost:%s", port);
});
