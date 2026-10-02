
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { AppError } from "./errorHandler.js";

export const authMiddleWare  = async (req,res,next) =>{

    try{

        const token = req.cookies?.token;

        if(!token) return next(new AppError("please login",401));

        const decoded = jwt.verify(token,process.env.JWT_SECRET);
         const user = await User.findById(decoded.id);

         if(!user) return next(new AppError("User no longer exists",401));

            req.user = user;
            next();


    }
    catch(err){
         return next(new AppError("Invalid or expired token", 401));
    }

}