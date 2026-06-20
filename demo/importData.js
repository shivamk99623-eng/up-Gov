const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");

const db = new sqlite3.Database("./demo.db");

db.serialize(() => {

  // ---------------- Customers ----------------
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER,
      name TEXT,
      country TEXT,
      status TEXT,
      category TEXT,
      city TEXT
    )
  `);

  const customerStmt = db.prepare(`
    INSERT INTO customers
    (id, name, country, status, category, city)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  db.run("BEGIN TRANSACTION");

  const customerFiles = ["data1.json"];

  customerFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(file));

    data.forEach(item => {
      customerStmt.run(
        item.id,
        item.name,
        item.country,
        item.status,
        item.category,
        item.city
      );
    });
  });

  customerStmt.finalize();

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_customer_country
    ON customers(country)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_customer_status
    ON customers(status)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_customer_category
    ON customers(category)
  `);


  // ---------------- Employees ----------------
  db.run(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER,
      name TEXT,
      age INTEGER,
      gender TEXT,
      country TEXT,
      status TEXT,
      category TEXT,
      city TEXT
    )
  `);

  const employees = JSON.parse(
    fs.readFileSync("data2.json")
  );

  const employeeStmt = db.prepare(`
    INSERT INTO employees
    (id, name, age, gender, country, status, category, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  employees.forEach(item => {
    employeeStmt.run(
      item.id,
      item.name,
      item.age,
      item.gender,
      item.country,
      item.status,
      item.category,
      item.city
    );
  });

  employeeStmt.finalize();

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_employee_country
    ON employees(country)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_employee_status
    ON employees(status)
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_employee_category
    ON employees(category)
  `);

  db.run("COMMIT");

});

db.close(() => {
  console.log("Import completed.");
});