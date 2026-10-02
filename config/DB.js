import mongoose from "mongoose";

const ConnectDB = async () =>{

    try{

        const  conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`DB connected : ${conn.connection.host}`);
       
    }
    catch(err){
         console.log("failed to connect DB  " , err);
    }
     
}

export default ConnectDB;