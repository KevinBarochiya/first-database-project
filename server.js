const express = require('express');
const path = require('path');
const fs = require('fs');
const usermodel = require("./models/user");
const postmodel = require("./models/post");
const cookieParser = require('cookie-parser');
const app = express();
const bcrypt = require('bcrypt');
const jwt= require('jsonwebtoken');

app.set('view engine',"ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.get("/",function(req,res){
    res.render("index");
});

app.get("/newregister",function(req,res){
    res.render("start");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/profile",isLogin ,async (req,res)=>{
    let user = await usermodel.findOne({email : req.user.email}).populate("posts");
    res.render("profile",{user});
});

app.get("/like/:id",isLogin ,async (req,res)=>{
    let post = await postmodel.findOne({_id : req.params.id}).populate("user");
    if(post.likes.indexOf(req.user.userid)===-1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
    await post.save();
    res.redirect("/profile");
});

app.post("/update/:id",isLogin ,async (req,res)=>{
    let post = await postmodel.findOneAndUpdate({_id : req.params.id},{content:req.body.content});
    res.redirect("/profile");
});

app.get("/edit/:id",isLogin ,async (req,res)=>{
    let post = await postmodel.findOne({_id : req.params.id}).populate("user");
    res.render("edit",{post});
});

app.post("/post",isLogin ,async (req,res)=>{
    let user = await usermodel.findOne({email : req.user.email});
    let {content}=req.body;
    let post =await postmodel.create({
        user:user._id,
        content:content
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
});

app.post("/register", async function(req,res){

    let {username,password,email,age,name}=req.body;
    let user =await usermodel.findOne({email});
    if(user) return res.status(500).redirect("/login");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let user = await usermodel.create({
                username,
                name,
                age,
                email,
                password: hash
            });

            let token = jwt.sign({email,userid:user._id},"KEVIN");
            res.cookie("token",token);
            res.redirect("/profile");
        });
    });
});

app.post("/login", async function(req,res){

    let {password,email}=req.body;
    let user =await usermodel.findOne({email});
    if(!user) return res.status(500).send('Something went wrong');

    bcrypt.compare(password,user.password,function(err,result){
        if(result) {
            let token = jwt.sign({email,userid:user._id},"KEVIN");
            res.cookie("token",token);
            res.status(200).redirect("/profile");
        }
        else redirect("/login");
    });
});

app.get("/logout",function(req,res){
    res.cookie("token","");
    res.redirect("/login");
});

function isLogin(req,res,next){
    if(req.cookies.token==="") res.redirect("/login");
    else{
        let data = jwt.verify(req.cookies.token,"KEVIN");
        req.user = data;
        next();
    }
};

const PORT = process.env.PORT || 2500; // Use the PORT variable or default to 3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
