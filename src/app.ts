import { faker } from "@faker-js/faker";

import { customerModel } from "./schema";
import { Customer } from "./types";
import connectDB from "./dbConnection";

const CREATION_INTERVAL = 200;

async function createCustomers(): Promise<void> {
  await connectDB();

  await customerModel.insertMany(
    getCustomers().map((x: Customer) => new customerModel(x))
  );
}

setInterval(createCustomers, CREATION_INTERVAL);

function getCustomers(): Customer[] {
  const customers: Customer[] = [];
  const numberOfCustomers = Math.floor(Math.random() * 9) + 1;

  for (let i = 0; i < numberOfCustomers; i++) {
    let customer: Customer = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      address: {
        line1: faker.location.streetAddress(),
        line2: faker.location.secondaryAddress(),
        postcode: faker.location.zipCode(),
        city: faker.location.city(),
        state: faker.location.state({ abbreviated: true }),
        country: faker.location.country(),
      },
      createdAt: new Date(),
    };
    customers.push(customer);
  }

  return customers;
}
