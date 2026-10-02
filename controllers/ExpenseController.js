import Expense from "../models/Expense.js";
import { AppError } from "../middleWare/errorHandler.js";
import { invalidateAnalyticsCache } from "../utils/cache.js";
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createExpense = async (req, res, next) => {
  try {
    const { title, amount, category, date } = req.body;
    const expense = await Expense.create({
      title,
      amount,
      category,
      date,
      user: req.user._id,
    });

    await invalidateAnalyticsCache(req.user._id);

    res.status(201).json(expense);
  } catch (err) {
    next(err);
  }
};
export const getExpenses = async (req, res, next) => {
  try {
    const { category, search, sort, page = 1, limit = 5 } = req.query;

    for (const value of [category, search, sort]) {
      if (value !== undefined && typeof value !== "string") {
        return next(new AppError("Invalid query parameter", 400));
      }
    }

    const filter = { user: req.user._id };
    if (category) filter.category = category;
    if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };

    const pageNumber = Number(page);
    const limitNumber = Math.min(Number(limit), 100); 

    if (
      !Number.isInteger(pageNumber) || pageNumber <= 0 ||
      !Number.isInteger(limitNumber) || limitNumber <= 0
    ) {
      return next(new AppError("Invalid queries", 400));
    }
    const skip = (pageNumber - 1) * limitNumber;

    const allowedSortFields = ["amount", "date", "title"];
    const sortOption = {};

    if (sort) {
      for (const field of sort.split(",")) {
        const isDescending = field.startsWith("-");
        const name = isDescending ? field.slice(1) : field;

        if (!allowedSortFields.includes(name)) {
          return next(new AppError(`Invalid sort query : ${field}`, 400));
        }
        sortOption[name] = isDescending ? -1 : 1;
      }
    } else {
      sortOption.date = -1; 
    }
    sortOption._id = 1; 

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    res.status(200).json({
      data: expenses,
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    });
  } catch (err) {
    next(err);
  }
};
export const getExpensesByID = async (req, res, next) => {
  try {
    const id = req.params.id;

    const expense = await Expense.findOne({
      _id : id , 
      user : req.user._id,
    });
    if (expense) res.status(200).json(expense);
    else return next(new AppError("expense not found", 404));
  } catch (err) {
    next(err);
  }
};

export const deleteExpensesByID = async (req, res, next) => {
  try {
    const id = req.params.id;
    const expense = await Expense.findOneAndDelete({
       _id : id,
       user : req.user._id,
    });
    if (expense) {
       await invalidateAnalyticsCache(req.user._id);
      res.status(200).json({ message: "Deleted Successfully" });
    }
    else return next(new AppError("expense not found", 404));
  } catch (err) {
    next(err);
  }
};
export const updateExpenseByID = async (req, res, next) => {
  try {
    const updates = {};
    for (const field of ["title", "amount", "category", "date"]) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { returnDocument: "after", runValidators: true }
    );

    if (!expense) return next(new AppError("expense not found", 404));

    await invalidateAnalyticsCache(req.user._id);
    res.status(200).json(expense);
  } catch (err) {
    next(err);
  }
};