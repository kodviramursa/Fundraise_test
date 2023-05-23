import mongoose from "mongoose";

const CUSTOMERS_COLLECTION_NAME = "customers";
const ANONYMISED_COLLECTION_NAME = "customers_anonymised";

export const customerSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  address: {
    line1: String,
    line2: String,
    postcode: String,
  },
  createdAt: String,
});

export const customerModel = mongoose.model(
  CUSTOMERS_COLLECTION_NAME,
  customerSchema
);

export const anonymisedCustomerModel = mongoose.model(
  ANONYMISED_COLLECTION_NAME,
  customerSchema
);
