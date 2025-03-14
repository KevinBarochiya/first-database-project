const mongoose = require('mongoose');
const { stringify } = require('querystring');

mongoose.connect("mongodb://127.0.0.1:27017/miniproject");

const userschema= mongoose.Schema({
    username:String,
    name:String,
    age:Number,
    email:String,
    password:String,
    posts:[
        {type : mongoose.Schema.Types.ObjectId, ref:"post"}
    ]
});

module.exports= mongoose.model('user',userschema);