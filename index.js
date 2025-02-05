const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose');
const res = require('express/lib/response');
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema({
  username: String
});

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
});

const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [Object]
});

let User = mongoose.model('User', userSchema);
let Exercise = mongoose.model('Exercise', exerciseSchema);
let Log = mongoose.model('Log', logSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// API endpoint to create new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  User.create({username: username}, (err, user) => {
    if(err){
      console.log(err);
    } else {
      res.json(user);
    }
  });
});

// API endpoint to get all users
app.get('/api/users', (req, res) => {
  User.find({}, (err, users) => {
    if(err) {
      console.log(err);
    } else {
      res.json(users);
    }
  });
});

// API endpoint to create exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const userId = req.params["_id"];
  User.findById({_id: userId}, function (err, user) {
    if(err){
      console.log(err);
    } else {
      if(!user){
        res.json({error: "user doesn't exist"});
      } else {
        const description = req.body.description;
        const duration = parseInt(req.body.duration);
        let date = req.body.date;
        if(!date){
          const d = new Date();
          date = d.toDateString();
        }
        Exercise.create({username: user.username, description: description, duration: duration, date: date}, (err, exercise) => {
          if(err) {
            console.log(err);
          } else {
            res.json({
              username: user.username,
              description: description,
              duration: duration,
              date: date,
              _id: user._id
            });
          }
        });
      }
    }
  });
});

// API endpoint to get full exercise log of an user
app.get('/api/users/:_id/logs', (req, res) => {
  const userId = req.params["_id"];
  User.findById({_id: userId}, function (err, user) {
    if(err){
      console.log(err);
    } else {
      Exercise.find({username: user.username}, (err, exercises) => {
        if(err) {
          console.log(err);
        } else {
          const from = req.query.from;
          const to = req.query.to;
          const limit = req.query.limit;
          if(from){
            exercises = exercises.filter(function(exercise) {
              const exerciseDate = new Date(exercise.date);
              const fromDate = new Date(from);
              return exerciseDate >= fromDate;
            })
          }
          if(to){
            exercises = exercises.filter(function(exercise) {
              const exerciseDate = new Date(exercise.date);
              const toDate = new Date(to);
              return exerciseDate <= toDate;
            })
          }
          if(limit){
            exercises = exercises.slice(0, parseInt(limit));
          }
          exercises = exercises.map(function(exercise) {
              return {
                "description": exercise.description,
                "duration": exercise.duration,
                "date": new Date(exercise.date).toDateString()
              }
          });
          res.json({
            username: user.username,
            count: exercises.length,
            _id: user._id,
            log: exercises
          })
        }
      });
    }
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
