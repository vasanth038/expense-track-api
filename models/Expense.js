import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({

     title : {
         type : String,
         trim : true,
         required : true,
     },
     amount : {
         
        type : Number,
        required : true,
         min : 0,
     },
     category : {
         type : String,
         trim : true,
         required : true,
         
     },
     date : {
         type : Date,
         default : Date.now,
     },
     user:{
         type : mongoose.Schema.Types.ObjectId,
         ref : 'User',
         required : true,
     }
     
}) 

ExpenseSchema.index({user : 1 , date :-1});
ExpenseSchema.index({user : 1 , category : 1});


const Expense = mongoose.model("Expense",ExpenseSchema);

export default Expense;