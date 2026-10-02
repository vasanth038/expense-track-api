import "dotenv/config";
import { jest } from "@jest/globals";
import mongoose from "mongoose";

jest.setTimeout(30000);

const getDbName = (uri) => new URL(uri).pathname.replace("/", "");

export const connectTestDB = async () => {
  const uri = process.env.MONGO_URI_TEST;

  if (!uri) {
    throw new Error("MONGO_URI_TEST is not set in .env");
  }

  const dbName = getDbName(uri);

  if (!dbName) {
    throw new Error(
      "MONGO_URI_TEST has no database name. Add one after the host, e.g. .../expense-tracker-test?..."
    );
  }
  if (!dbName.endsWith("test")) {
    throw new Error(`Test database name must end with "test" (got "${dbName}"). Refusing to run.`);
  }
  if (process.env.MONGO_URI && getDbName(process.env.MONGO_URI) === dbName) {
    throw new Error("MONGO_URI_TEST uses the same database as MONGO_URI. Refusing to run.");
  }

  await mongoose.connect(uri);
};

export const clearDB = async () => {
  const collections = Object.values(mongoose.connection.collections);
  for (const collection of collections) {
    await collection.deleteMany({});
  }
};

export const disconnectTestDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
};