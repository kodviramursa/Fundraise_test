import mongoose from "mongoose";

require("dotenv").config();

const connectDB = async (): Promise<void> => {
  try {
    const connectionOptions: any = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        (process.env.DB_URI ?? "") + "/dbName",
        connectionOptions
      );

      console.log("Connected to MongoDB");
    }
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);

    await mongoose.disconnect();
  }
};

export default connectDB;
