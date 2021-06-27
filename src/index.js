const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

const customers = [];

app.use(express.json());

function verifyIfAccountExists(request, response, next) {
  const { cpf } = request.headers;

  const customer = customers.find((customer) => customer.cpf === cpf);

  if (!customer) {
    return response.status(404).json({ error: "Customer not found." });
  }

  request.customer = customer;

  return next();
}

function getBalance(statement) {
  return statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  );

  if (customerAlreadyExists) {
    return response.status(400).json({ error: "Customer already exists." });
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

app.get("/statement", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  return response.status(200).json(customer.statement);
});

app.post("/deposit", verifyIfAccountExists, (request, response) => {
  const { description, amount } = request.body;
  const { customer } = request;

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfAccountExists, (request, response) => {
  const { amount } = request.body;
  const { customer } = request;
  const balance = getBalance(customer.statement);

  if (balance < amount) {
    return response.status(400).json({ error: "bitch u broke" });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  customer.statement.push(statementOperation);

  return response.status(201).send();
});

app.get("/statement/date", verifyIfAccountExists, (request, response) => {
  const { customer } = request;

  const { date } = request.query;
  const dateFormat = new Date(date + " 00:00");

  const filteredStatements = customer.statement.filter(
    (statement) =>
      statement.created_at.toDateString() ===
      new Date(dateFormat).toDateString()
  );

  return response.status(200).json(filteredStatements);
});

app.put("/account", verifyIfAccountExists, (request, response) => {
  const { name } = request.body;
  const { customer } = request;

  customer.name = name;

  return response.status(201).send();
});

app.get("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  return response.status(200).json(customer);
});

app.delete("/account", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  customers.splice(customer, 1);
  return response.status(204).send();
});

app.get("/balance", verifyIfAccountExists, (request, response) => {
  const { customer } = request;
  const balance = getBalance(customer.statement);
  return response.status(200).json({ balance: balance });
});

app.listen(3333);
