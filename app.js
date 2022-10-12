require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//const encrypt = require('mongoose-encryption');
//const md5 = require("md5");
const bcrypt = require('bcrypt');
const saltRounds = 10;




const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);




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

  bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    const user1 = new User({
      email: req.body.username,
      password: hash
    })
    user1.save(function(err){
      if(err){
        res.send(err);
      }else{
        res.redirect("/login")
      }
    });
  });

});



// LOGIN_Page (using express chain routing)
app.route("/login")

.get(function(req,res){
  res.render("login");
})

.post(function(req,res){
  User.findOne({email: req.body.username},function(err,result){
    if(err){
      console.log(err);
    }else if(result){
      bcrypt.compare(req.body.password, result.password, function(err, result) {
        if(result == true){
          res.render("secrets");
        }
      });
    }
  })
});



app.listen(3000);
