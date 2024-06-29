const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const port = 3006;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// PostgreSQL Configuration
const pool = new Pool({
    user: 'mansi',
    host: 'localhost',
    database: 'hrm',
    password: 'a',
    port: 5432,
});

// Nodemailer Configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mansi_01@fosteringlinux.com',
        pass: 'mansi2002@#'
    }
});

// Hardcoded credentials (for demonstration purposes)
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

// Render Add Employee Form
app.get('/add-employee', (req, res) => {
  res.render('add-employee');
});

app.post('/add-employee', async (req, res) => {
  const { name, email, phone, joining_date, department, qualification } = req.body;

  try {
      const result = await pool.query('INSERT INTO employees (name, email, phone, joining_date, department, qualification) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, email, phone, joining_date, department, qualification]);
      console.log('Employee added successfully:', result.rows[0]);
      res.redirect('/show-employees'); // Redirect to the page where employees are displayed
  } catch (err) {
      console.error('Error adding employee:', err);
      res.status(500).send('Error adding employee');
  }
});

// Show Employees
app.get('/show-employees', async (req, res) => {
    const result = await pool.query('SELECT * FROM employees');
    res.render('show-employees', { employees: result.rows });
});

// Search Employees
app.get('/search-employees', async (req, res) => {
  const searchQuery = req.query.search || '';
  try {
      const result = await pool.query('SELECT * FROM employees WHERE name ILIKE $1 OR department ILIKE $1', [`%${searchQuery}%`]);
      res.render('show-employees', { employees: result.rows });
  } catch (err) {
      console.error('Error searching employees:', err);
      res.status(500).send('Error searching employees');
  }
});

// Render Edit Employee Form
app.get('/edit-employee/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM employees WHERE id = $1', [id]);
        const employee = result.rows[0];
        if (!employee) {
            return res.status(404).send('Employee not found');
        }
        res.render('edit-employee', { employee });
    } catch (err) {
        console.error('Error retrieving employee:', err);
        res.status(500).send('Error retrieving employee');
    }
});

// Handle Edit Employee Form Submission
app.post('/update-employee/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, joining_date, department, qualification } = req.body;

    try {
        await pool.query('UPDATE employees SET name = $1, email = $2, phone = $3, joining_date = $4, department = $5, qualification = $6 WHERE id = $7', [name, email, phone, joining_date, department, qualification, id]);
        res.redirect('/show-employees');
    } catch (err) {
        console.error('Error updating employee:', err);
        res.status(500).send('Error updating employee');
    }
});

// Delete Employee
app.post('/delete-employee/:id', async (req, res) => {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING *', [id]);
    const employee = result.rows[0];

    // Send email to notify about employee deletion
    const mailOptions = {
        from: 'mansi_01@fosteringlinux.com',
        to: 'mansinawariya1@gmail.com', // Update with recipient email
        subject: 'Employee Deleted',
        text: `Employee ${employee.name} has been deleted from the records.`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.redirect('/show-employees');
});

// Resignation Page
app.get('/resignation', (req, res) => {
  res.render('resignation');
});

app.post('/submit-resignation', async (req, res) => {
  const { id, name, email, reason } = req.body;

  // Send resignation email to all employees
  await sendResignationEmail(id, name);

  res.send(`Resignation notification sent for ${name} (ID: ${id})`);
});

async function sendResignationEmail(employeeId, employeeName) {
  const mailOptions = {
      from: 'mansi_01@fosteringlinux.com',
      to: 'allemployees@company.com', // Update with recipient email for all employees
      subject: 'Resignation Notification',
      text: `${employeeName} (ID: ${employeeId}) has resigned from the company. Please take necessary actions.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
          console.log(error);
      } else {
          console.log('Resignation notification sent: ' + info.response);
      }
  });

  // Send email to Raju Sir to deactivate the employee ID
  const rajuSirMailOptions = {
      from: 'mansi_01@fosteringlinux.com',
      to: 'raju_sir@company.com', // Update with Raju Sir's email
      subject: 'Deactivate Employee ID',
      text: `${employeeName}'s (ID: ${employeeId}) ID needs to be deactivated. Please deactivate the account.`
  };

  transporter.sendMail(rajuSirMailOptions, (error, info) => {
      if (error) {
          console.log(error);
      } else {
          console.log('Deactivation request sent to Raju Sir: ' + info.response);
      }
  });
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
