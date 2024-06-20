const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const nodemailer = require('nodemailer'); // Import nodemailer once
const path = require('path');
const app = express();
const port = 3006;

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hrm',
  password: 'mansi2002@',
  port: 5432,
});

// Hardcoded credentials
const hardcodedUsername = 'admin';
const hardcodedPassword = 'hr@123';

// Login Page
app.get('/', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === hardcodedUsername && password === hardcodedPassword) {
    res.redirect('/home');
  } else {
    res.send('Invalid username or password');
  }
});

// Home Page
app.get('/home', (req, res) => {
  res.render('home');
});

// Add Employee
app.get('/add-employee', (req, res) => {
  res.render('add-employee');
});

app.post('/add-employee', async (req, res) => {
  const { name, email, phone, joining_date, department, qualification } = req.body;
  await pool.query('INSERT INTO employees (name, email, phone, joining_date, department, qualification) VALUES ($1, $2, $3, $4, $5, $6)', [name, email, phone, joining_date, department, qualification]);
  res.redirect('/show-employees');
});

// Show Employees
app.get('/show-employees', async (req, res) => {
  const result = await pool.query('SELECT * FROM employees');
  res.render('show-employees', { employees: result.rows });
});

// Delete Employee
app.post('/delete-employee/:id', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
  const employee = result.rows[0];

// Resignation Page
app.get('/resignation', (req, res) => {
  res.render('resignation');
});

app.post('/resignation', async (req, res) => {
  const { employeeName } = req.body;

// Send resignation email to all employees
  await sendResignationEmail(employeeName);

  res.send(`Resignation notification sent for ${employeeName}`);
});


// Sending email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'mansi_01@fosteringlinux.com',
      pass: 'mansi2002@#'
    }
  });

  const mailOptions = {
    from: 'mansi_01@fosteringlinux.com',
    to: 'mansinawariya1@gmail.com',
    subject: 'Employee Deleted',
    text: `Employee ${employee.name} has been deleted from the records.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Email sent: ' + info.response);
  });

  res.redirect('/show-employees');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
