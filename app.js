const express = require("express");
const fs = require("fs");
const path = require("path"); // For resolving file paths
const multer = require("multer");
const mongoose = require('mongoose');
require('dotenv').config();
const session = require('express-session');
const { isAuthenticated } = require('./middleware/auth');
const bcryptjs = require('bcryptjs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir);
}

// Set EJS as the view engine
app.set("view engine", "ejs");

// Serve static files from the 'public' folder (for CSS, JS, etc.)
app.use(express.static("public")); // Serve static files
app.use(express.static(path.join(__dirname, "uploads"))); // For images

// Middleware for parsing JSON data and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Get the index page
app.get("/", (req, res) => {
  fs.readFile("workout-plans.json", "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    const workoutPlans = JSON.parse(data);
    res.render("index", { workoutPlans });
  });
});

// Get admin page
app.get("/admin", (req, res) => {
  const editIndex = req.query.edit;
  const selectedDay = req.query.day || 'monday';
  
  fs.readFile("workout-plans.json", "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");
    
    const workoutPlans = JSON.parse(data);
    const editMode = editIndex !== undefined;
    const workout = editMode && workoutPlans[selectedDay].plans[editIndex] 
      ? workoutPlans[selectedDay].plans[editIndex] 
      : null;
    
    res.render("admin", { 
      workoutPlans,
      editMode,
      workout,
      editIndex,
      selectedDay
    });
  });
});

// Add new workout plan
app.post("/plans", upload.single("image"), (req, res) => {
  const { day, name, description, duration } = req.body;
  
  fs.readFile("workout-plans.json", "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const workoutPlans = JSON.parse(data);
    
    // Initialize plans array if it doesn't exist
    if (!workoutPlans[day]) {
      workoutPlans[day] = { plans: [] };
    }
    
    const newPlan = {
      name,
      description,
      duration: parseInt(duration),
      image: req.file ? `/${req.file.filename}` : '/default-workout.jpg'
    };

    workoutPlans[day].plans.push(newPlan);

    fs.writeFile("workout-plans.json", JSON.stringify(workoutPlans, null, 2), (err) => {
      if (err) return res.status(500).send("Error writing file");
      res.redirect(`/admin?day=${day}`);
    });
  });
});

// Update workout plan
app.post("/plans/:day/:index", upload.single("image"), (req, res) => {
  const { day, index } = req.params;
  const { name, description, duration } = req.body;
  
  fs.readFile("workout-plans.json", "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const workoutPlans = JSON.parse(data);
    
    // Initialize plans array if it doesn't exist
    if (!workoutPlans[day]) {
      workoutPlans[day] = { plans: [] };
    }

    const updatedPlan = {
      name,
      description,
      duration: parseInt(duration),
      image: req.file ? `/${req.file.filename}` : (
        workoutPlans[day].plans[index] ? workoutPlans[day].plans[index].image : '/default-workout.jpg'
      )
    };

    workoutPlans[day].plans[index] = updatedPlan;

    fs.writeFile("workout-plans.json", JSON.stringify(workoutPlans, null, 2), (err) => {
      if (err) return res.status(500).send("Error writing file");
      res.redirect(`/admin?day=${day}`);
    });
  });
});

// Delete workout plan
app.post("/plans/:day/:index/delete", (req, res) => {
  const { day, index } = req.params;

  fs.readFile("workout-plans.json", "utf-8", (err, data) => {
    if (err) return res.status(500).send("Error reading file");

    const workoutPlans = JSON.parse(data);
    
    if (workoutPlans[day] && workoutPlans[day].plans) {
      workoutPlans[day].plans.splice(index, 1);
    }

    fs.writeFile("workout-plans.json", JSON.stringify(workoutPlans, null, 2), (err) => {
      if (err) return res.status(500).send("Error writing file");
      res.redirect(`/admin?day=${day}`);
    });
  });
});

// Serve uploaded images
app.use("/uploads", express.static("uploads"));

// Admin routes
app.get('/admin/login', (req, res) => {
    res.render('admin-login');
});

app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    console.log('Login attempt:', { username, password }); // For debugging
    
    if (username === 'admin' && password === 'alo') {
        req.session.isAdmin = true;
        res.redirect('/admin');
    } else {
        console.log('Login failed'); // For debugging
        res.redirect('/admin/login');
    }
});

// Protected admin route
app.get('/admin', isAuthenticated, (req, res) => {
    res.render('admin'); // Create this view for admin dashboard
});

app.get('/admin/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
