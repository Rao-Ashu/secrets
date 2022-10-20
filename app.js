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
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;                  //STEP 1
const findOrCreate = require("mongoose-findorcreate");                               //STEP 3


const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,                                                                //STEP 8 to add new fields googleId and secret ehich they will post
  secret: String
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);                                                      //STEP 4

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {                                         //STEP 7
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  User.findById(id,function(id, user){
    cb(err,user);
  });
});



passport.use(new GoogleStrategy({                                                       //STEP 2
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// HOME_Page (using express chain routing)
app.get("/", function(req,res){
  res.render("home");
});


// TO GET THE GOOGLE LOGIN PAGE AFTER CLICKING LOGIN WITH GOOGLE
app.get("/auth/google",
  passport.authenticate("google", {scope: ['profile'] })                          //STEP 5
)

app.get('/auth/google/secrets',                                                   //STEP 6
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
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
