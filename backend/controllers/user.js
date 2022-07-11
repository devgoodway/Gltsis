var passport = require('passport')

const { User } = require("../models/User");
const { checkSchema,validationResult } = require("express-validator")

const specialRegExp = /[!@#$%^&*()]+/;

const localSchema={
    userId:{
        in:"body",
        trim:true,
        isLength:{
            errorMessage:"ID length error",
            options:{min:4,max:20}
        },
        isAlphanumeric:{
            errorMessage:"ID must be alphanumeric"
        }
    },
    password:{
        in:"body",
        trim:true,
        isLength:{
            errorMessage:"Password length error",
            options:{min:8,max:20}
        },
        matches:{
            errorMessage:"Password must contain one special character",
            options:specialRegExp
        }
    },
    email:{
        in:"body",
        trim:true,
        isEmail:{
            errorMessage:"invalid email"
        }
    }
}
const googleSchema={
    email:{
        in:"body",
        trim:true,
        isEmail:{
            errorMessage:"invalid email"
        }
    },
    name:{
        in:"body",
        trim:true
    },
    snsId:{
        in:"body"
    },
    provider:{
        in:"body",
        matches:{
            errorMessage:"provider should be google",
            options:/^google$/
        }
    }
}

exports.localValidate = checkSchema(localSchema);
exports.googleValidate = checkSchema(googleSchema);

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try{
        const exUser=await User.findOne({userId:req.body.userId});
        if(exUser) return res.status(409).send({message: "User already exists with such id" });
        const newUser = new User(req.body);
        const doc = await newUser.save()
        req.login(newUser, loginError => {
            if (loginError) return res.status(500).send({ loginError });
            return res.status(200).send({
                success: true, newUser
            });
        });
    }
    catch(err){
        if (err) return res.status(500).send({ err });
    }
}

exports.login = (req, res, next) => {
    passport.authenticate('local', (authError, user, message) => {
        if (authError) return res.status(500).send({ authError });
        if (!user) return res.status(409).send(message);
        req.login(user, loginError => {
            if (loginError) return res.status(500).send({ loginError });
            return res.status(200).send({
                success: true, user
            });
        });
    })(req, res, next)
}

exports.logout = (req, res) => {
    req.logout((err)=>{
        if(err) return res.status(500).send({ err });
        req.session.destroy();  
        console.log("you are logged out!")
        return res.status(200).send({success:true})
    });
}

exports.googleAuth=(req,res,next)=>{
    passport.authenticate('google', { scope: ['profile', 'email'] })(req,res,next)
}

exports.googleLogin = (req, res, next) => {
    passport.authenticate('google', (authError, user, message) => {
        if (authError) return res.redirect('/'); //클라이언트 주소로 바꿔주세요!
        if (!user){
            console.log('googleLogin: no user. redirect to google/register!')
            req.session.profile=message.profile;
            return req.session.save(()=>{                   
                res.redirect('http://localhost:3001') //클라이언트 주소로 바꿔주세요!
            });
        } 
        req.login(user, loginError => {
            if (loginError) return res.redirect('/') //클라이언트 주소로 바꿔주세요!
            return res.redirect('/')
        });
    })(req, res, next)
}

exports.getProfile=(req,res)=>{
    if(req.session.profile){
        return res.status(200).send(req.session.profile)
    }
    return res.status(404).send({message:"no profile in session!"})
}

exports.googleRegister = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try{
        const exUser=await User.findOne({ snsId: req.body.snsId, provider: 'google' });
        if(exUser) return res.status(409).send({message: "User already exists with such id" });
        const newUser = new User(req.body);
        const doc = await newUser.save()
        req.login(newUser, loginError => {
            if (loginError) return res.status(500).send({ loginError });
            return res.status(200).send({
                success: true, newUser
            });
        });
    }
    catch(err){
        if (err) return res.status(500).send({ err });
    }
}