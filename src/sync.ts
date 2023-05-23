import * as crypto from "crypto";
import * as mongodb from "mongodb";
import * as fs from "fs";

import connectDB from "./dbConnection";
import { Customer } from "./types";
import { anonymisedCustomerModel, customerModel } from "./schema";

const FULL_SYNC_FLAG = "--full-reindex";
const STATE_FILE_PATH = "./resumeToken.json";
const [, , ...args] = process.argv;
const isFullSyncMode = args.includes(FULL_SYNC_FLAG);

(async function () {
  await connectDB();

  if (isFullSyncMode) {
    await fullSync();
  } else {
    await realtimeSync();
  }
})();

async function fullSync(): Promise<void> {
  const customers = await customerModel.find().exec();
  const anonymisedCustomers = customers.map((customer: mongodb.Document) =>
    anonymiseCustomer(customer as Customer)
  );
  const bulkOperations = anonymisedCustomers.map((anonymisedCustomer) =>
    getReplaceObject(anonymisedCustomer)
  );

  await bulkWriteToAnonymised(bulkOperations);
  // await customerModel.deleteMany();
  // await anonymisedCustomerModel.deleteMany();
  console.log(await customerModel.find().count());
  console.log(await anonymisedCustomerModel.find().count());
}

async function realtimeSync(): Promise<void> {
  let resumeToken: mongodb.ResumeToken | undefined;
  let timerId: NodeJS.Timeout | undefined;
  let bulkOperations: mongodb.AnyBulkWriteOperation<any>[] = [];
  // await customerModel.deleteMany();
  // await anonymisedCustomerModel.deleteMany();
  console.log(await customerModel.find().count());
  console.log(await anonymisedCustomerModel.find().count());
  const changeStream = await customerModel.watch([], {
    resumeAfter: getResumeToken(),
  });

  changeStream.on("change", async (next) => {
    if (next.operationType === "insert") {
      resumeToken = next._id;
      const customer = next.fullDocument;
      const anonymisedCustomer = anonymiseCustomer(customer);
      const accumulationTime = 1000;
      const accumulationDocumentCount = 1000;

      bulkOperations.push(getReplaceObject(anonymisedCustomer));

      if (!timerId) {
        timerId = setTimeout(() => {
          bulkWriteToAnonymised(bulkOperations, resumeToken);
          bulkOperations = [];
          clearTimeout(timerId);
          timerId = undefined;
        }, accumulationTime);
      }

      if (bulkOperations.length >= accumulationDocumentCount) {
        bulkWriteToAnonymised(bulkOperations, resumeToken);
        bulkOperations = [];
        if (timerId) {
          clearTimeout(timerId);
          timerId = undefined;
        }
      }
    }
  });
}

async function bulkWriteToAnonymised(
  bulkOperations: mongodb.AnyBulkWriteOperation<any>[],
  resumeToken?: mongodb.ResumeToken
): Promise<void> {
  if (bulkOperations.length > 0) {
    await anonymisedCustomerModel.bulkWrite(bulkOperations);
  }
  if (resumeToken) {
    saveResumeToken(resumeToken);
  }
}

function saveResumeToken(lastSyncTime: mongodb.ResumeToken) {
  const state = { lastSyncTime };
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state));
}

function getResumeToken(): mongodb.ResumeToken | null {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE_PATH).toString());
    return state.lastSyncTime;
  } catch (error) {
    return null;
  }
}

function anonymiseString(inputString: string) {
  const hash = crypto.createHash("sha256");
  const hexHash = hash.update(inputString).digest("base64");

  return hexHash.replace(/[^a-zA-Z\d]/g, "0").substring(0, 8);
}

function anonymiseCustomer(customer: Customer): mongodb.Document {
  const [emailName, domain] = customer.email.split("@");

  return {
    _id: customer._id,
    firstName: anonymiseString(customer.firstName),
    lastName: anonymiseString(customer.lastName),
    email: `${anonymiseString(emailName)}@${domain}`,
    address: {
      ...customer.address,
      line1: anonymiseString(customer.address.line1),
      line2: anonymiseString(customer.address.line2),
      postcode: anonymiseString(customer.address.postcode),
    },
    createdAt: customer.createdAt,
  };
}

function getReplaceObject(
  document: mongodb.Document
): mongodb.AnyBulkWriteOperation<any> {
  return {
    replaceOne: {
      filter: { _id: document._id },
      replacement: document,
      upsert: true,
    },
  };
}
