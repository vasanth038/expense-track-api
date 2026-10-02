import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {AppError} from "../middleWare/errorHandler.js";


const cookiesOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 24*60*60*1000,
};

const sendToken = (user, statusCode, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  res.cookie("token", token, cookiesOptions);

  res.status(statusCode).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  });
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return next(new AppError("name , email and password are required", 400));
    }
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
  return next(new AppError("Invalid input", 400));
}

    if (password.length < 6) {
      return next(
        new AppError("password should contain at least 6 characters", 400),
      );
    }
     const norEmail =    email.toLowerCase().trim();
    const isExisting = await User.findOne({
    email : norEmail,
    });

    if (isExisting) {
      return next(new AppError("email already exists", 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email : norEmail, password : hashedPassword });

    sendToken(user, 201, res);
  } catch (err) {
    next(err);
  }
};


export const login = async (req,res,next) =>{

    try{

        const {email , password}  = req.body;

        if( typeof email !== "string" || typeof password != "string" ){
           return next(new AppError("email and password are requiered",400));
        }

        const norEmail =  email.toLowerCase().trim();
        const user = await User.findOne({email : norEmail});

        const isMatching = user && (await  bcrypt.compare(password , user.password) );

        if(!isMatching){
             return next(new AppError("Invalid credentials" , 401));
        }

        sendToken(user,200,res);
    }
    catch(err){
         next(err);
    }

}

export const logout = async (req ,res) =>{

    res.clearCookie("token",{
         httpOnly : cookiesOptions.httpOnly,
        secure : cookiesOptions.secure,
        sameSite : cookiesOptions.sameSite,
        maxAge : cookiesOptions.maxAge,
    });

    res.status(200).json({
         success : true,
          message : "successfully logged out",
    })

}

export const getMe = (req,res) => {
     
    res.status(200).json({
        success : true,
         user : {
             id : req.user._id,
             name : req.user.name,
             email : req.user.email,
         },
    });
};
