const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const adminLogin = {
  email: "admin@example.com",
  password: "admin123"
};

// Register Controller
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashed, role: "user" });
    await newUser.save();
    res.status(201).json({ msg: "Registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ msg: "Registration failed" });
  }
};

// Login Controller
exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt with email:", email); // Debugging

  // Admin login logic
  if (email === adminLogin.email && password === adminLogin.password) {
    const token = jwt.sign({ role: "admin", email }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { name: "Admin", role: "admin" } });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ msg: "Login failed" });
  }
};
