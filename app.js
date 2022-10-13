require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require('mongoose-encryption');
//const md5 = require("md5");

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require("express-session");
const passport = require("passport");                                         //STEP 1
const passportLocalMongoose = require("passport-local-mongoose");




const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret:process.env.SECRET,                                                 //STEP 2
  resave:false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);                                      //STEP 3

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
                                                                              //STEP 4
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




// HOME_Page (using express chain routing)
app.get("/", function(req,res){
  res.render("home");
});




// REGISTER_Page (using express chain routing)
app.route("/register")

.get(function(req,res){
  res.render("register");
})

.post(function(req,res){

  User.register({username:req.body.username}, req.body.password, function(err, user) {
  if (err) {
    console.log(err);                                                         //STEP 5
    res.redirect("/register")
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect('/secrets');
  });
  }
});

});




// SECRET page, only allowed after authentication
app.get("/secrets", function(req,res){                                        //STEP 6
  if(req.isAuthenticated()){
    res.render("secrets");
  }else{
    res.redirect("/login");
  }
});



// LOGIN_Page (using express chain routing)
app.route("/login")                                                           //STEP 7

.get(function(req,res){
  res.render("login");
})

.post(function(req,res){
  const user1 = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user1,function(err){
    if(err){
      console.log(err);
      res.redirect("/login");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect('/secrets');
    });
    }
  })

});

// LOGOUT page
// app.get("/logout", function(req, res){
//   req.logOut();
//   res.redirect("/");
// });
app.get('/logout', function(req, res, next){                                  //STEP 8
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});



app.listen(3000);
