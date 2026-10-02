import {body , validationResult } from 'express-validator';
 
  
 const handelValidationErrors = (req,res,next) =>{

    const errors = validationResult(req);

    if(!errors.isEmpty()){

        return res.status(400).json({
           errors : errors.array().map((err) => ({
            field : err.path,
            message : err.msg,
           }))
    });
    }
  next();
     
 }

 export const validateCreateExpense = [
     
     body('title')
     .trim()
     .notEmpty()
     .withMessage("titel is required") ,
     
     body('category')
     .trim()
     .notEmpty()
     .withMessage('category is required'),

     body('amount')
     .isNumeric()
     .withMessage("amount must be a number")
     .bail()
     .isFloat({min : 0 })
     .withMessage("amount can't be negative") ,
   
     handelValidationErrors,
     
 ] ;


 export const validateUpdateExpense = [

    body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage("titel can't be empty"),


    body("category")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("category can't be empty"),

    body("amount")
    .optional()
    .isNumeric()
    .withMessage("amount must be a number")
     .custom(value => value >= 0)
     .withMessage("amount can't be negative") ,


     handelValidationErrors,

 ] ;



