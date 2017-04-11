var express = require('express');
var session = require('express-session');
var app = express();
var fs = require('fs');
var bodyParse = require('body-parser');
var http = require('http');
var indexrouter = express.Router();
var mongoDB = require('app.js');

var querystring = require('querystring');
var crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    cryPass = 'd6F3Efeq';


function encrypt(text){
  if (text == undefined){ }
  else {
  var cipher = crypto.createCipher(algorithm,cryPass)
  var crypted = cipher.update(text,'utf8','hex')
  crypted += cipher.final('hex');
  return crypted;
}
}


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
      fn = __dirname + '/error.html'
      res.sendFile(fn);
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
  var instructor = req.query.instructorName;
  var gradeRequired = req.query.gradeRequired;
  var gradeDesired = req.query.gradeDesired;



  // db.collection('course').insert({course_Name:name, teacherID: id, userID: id, courseID: getNextSequence("courseID")}, function(error,documents){
  //   console.log(documents);
  // });
  // db.collection('counter').find({}).toArray(  function(err,doc){
  //   console.log(doc);
  // });
  db.collection('counter').update({_id:"_courseID"},  { $inc: { seq: 1} } );

  db.collection('counter').find({_id:"_courseID"}).toArray(function(err,doc){
    db.collection('course').insert({course_Name:name, instructorName:instructor, userID: id, courseID: doc[0].seq});
    db.collection('user_course').insert({courseID:doc[0].seq, userID: id, gradeRequired:gradeRequired, gradeDesired:gradeDesired});
  });
});

app.post('/getProgress', function (req,res) {

  var db = mongoDB.getDB();
  var id = req.session.userID;
  var assignmentIDs = [];


  db.collection('user_assignment').find({userID:id}).toArray(function(err,doc){
    for(i=0;i<doc.length;i++){
      assignmentIDs[i] = doc[i].assignmentID;
    }
    db.collection('assignment').find({courseID: {$in: assignmentIDs} }).toArray(function(error,documents) {

      //console.log(doc);
      res.send(documents);

    });
  });

});

app.post('/removeCourse', function(req,res){

  var db = mongoDB.getDB();
  var name = req.body.courseName;
  db.collection('courses').remove({course:name});

});

app.post('/addUser', function(req,res) {
  var db = mongoDB.getDB();
  var username = req.body.username;
  var name = req.body.name;
  var school = req.body.school;
  var password = req.body.pw;
  var isStudent = req.body.isStudent;

  //encrypt password
  var pw = encrypt(password);
  //console.log(pw);

  //console.log("add user:" + username + " | " + isStudent);

  db.collection('user').find({username:username}).toArray(function(error, documents) {
    //console.log(documents.length);
    if (documents.length > 0){
      res.redirect("/signup?un=true");
    }
    else {
      db.collection('counter').update({_id:"_userID"},  { $inc: { seq: 1} } );
      db.collection('counter').find({_id:"_userID"}).toArray(function(err,doc){
        if (isStudent==1){
          //CHANGE TO NEW DB LAYOUT
          db.collection('user').insert({userID:doc[0].seq, name:username, isStudent:'true', isTeacher:'false', pwd:pw});
        }
        else {
          //CHANGE TO NEW DB LAYOUT
          db.collection('user').insert({userID:doc[0].seq, name:username, isStudent:'false', isTeacher:'true', pwd:pw});
        }
      });


      res.redirect("/?un=false");
    }
  });
});

app.post('/login', function(req,res){

  var username = req.body.un;
  var password = req.body.pw;

  var pw = encrypt(password);
  var login =
  {
    'username':username,
    'password':pw
  }


  var postData = querystring.stringify(login);


  var keepAliveAgent = new http.Agent(
    {
      keepAlive: true
    }
  );

  var post_options = {
    host:'localhost',
    port:'3001',
    path:'http://localhost:3001/authenticateUser',
    method:'POST',
    agent: keepAliveAgent,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  var token;
  var post_req = http.request(post_options, function(resp) {
        resp.setEncoding('utf8');
        resp.on('data', function (chunk) {

              token = JSON.parse(chunk);

              var destination;
              if(token.token == 'True')
              {
                req.session.token="true";
                req.session.userID = token.userID;
                var fn=__dirname + '/public/' + 'secure.html'

              destination = 'http://localhost:3000/index';

              }
              else{
                destination = 'http://localhost:3000/error';
              }



              res.send(destination);
        })
    })

    post_req.write(postData);
    post_req.end();

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
