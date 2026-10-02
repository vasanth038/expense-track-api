import Expense from "../models/Expense.js";

import { invalidateAnalyticsCache , getCache , setCache,getAnalyticsCacheKeys} from "../utils/cache.js";


const round = (n) => Math.round(n*100)/100;

export const getTotal = async (req,res,next) =>{

    try{

        const userId = req.user._id;

         const {total} = getAnalyticsCacheKeys(userId);
         const cacheData = await getCache(total);

         if(cacheData) {
            return res.status(200).json(
                JSON.parse(cacheData)
            )
         }

        const result = await Expense.aggregate([
            { $match : {user : userId}},
            {
                $group:{
                    _id : null,
                    totalAmount : {$sum : "$amount"},
                    averageAmount : {$avg : '$amount'},
                    count : {$sum : 1},
                }
            }
        ]);

        const stats = result[0] || {
            totalAmount : 0,
            averageAmount:0,
            count : 0,
        }
         
        const response = {
              success : true,
             totalAmount : round(stats.totalAmount),
             averageAmount : round(stats.averageAmount),
             count : stats.count,
        }

       await setCache(total,response);
        res.status(200).json(response );

    }
    catch(err){
        next(err);
    }
     
}

export const getByCategory = async(req,res,next) =>{
     try{

         const userId = req.user._id;
          const {category } = getAnalyticsCacheKeys(userId);
          const cacheData= await getCache(category);
          if(cacheData) return res.status(200).json(
            JSON.parse(cacheData)
          )
         const result = await Expense.aggregate([
             {$match : {user : userId }},
             {$group :{
                 _id : '$category',
                 totalAmount : {$sum : '$amount'},
                 count : {$sum : 1},
             }},
             {$sort : {totalAmount : -1}},
             {$project : {
                 _id : 0,
                 category : "$_id",
                 total : "$totalAmount",
                 count : 1
             }}
         ]);
 

         const response = {
             success : true,
             result,
         };

         await setCache(category , response);

         res.status(200).json(
           response
         )

     }
     catch(err){
        next(err);
     }
     
};

export const getMonthly = async (req,res,next) =>{
   try {
      
    const userId = req.user._id;
    const {monthly} = getAnalyticsCacheKeys(userId);
          const cacheData= await getCache(monthly);
    if(cacheData){
         return res.status(200).json(JSON.parse(cacheData));
    }
    const data = await Expense.aggregate([
      { $match: { user: userId} },
      {
        $group: {
          _id: { year: { $year: "$date" }, month: { $month: "$date" } },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          year: "$_id.year",
          month: "$_id.month",
          total: 1,
          count: 1,
        },
      },
      { $sort: { year: 1, month: 1 } },
    ]);
    const response = {
        success: true, 
         data 
    }
     await setCache(monthly,response);
    res.status(200).json(response);
}
     catch(err){
        next(err);
     }
}