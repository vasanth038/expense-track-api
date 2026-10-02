
export class AppError extends Error {

    constructor(message , statusCode){
        super(message);
        this.statusCode = statusCode;
    }
     
}

export const notFound = (req,res,next) =>{

    next(
         new AppError(`Route not found : ${req.method} ${req.originalUrl}`,404)
    );
     
};

export const errorHandler = (err,req,res,next ) => {

    let statusCode = 500;
    let message = "Server error";

    if(err instanceof AppError){
         statusCode = err.statusCode || 500;
         message = err.message;
    }
    else if(err.code === 11000){
          statusCode = 409;
        message = "Email already exists";

    }
    else if(err.name === 'ValidationError' || err.name === 'CastError'){
             statusCode = 400;
         message = err.message;
    }
    else if(err.type === 'entity.parse.failed'){
         statusCode = 400;
         message = "Invalid JSON in request body";
    }
    else {
        console.error(err);
    }

    res.status(statusCode).json({
        success : false,
        message : message,
    })


}