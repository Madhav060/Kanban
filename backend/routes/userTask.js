const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Get tasks assigned to the user by email (no auth)
router.get('/my-tasks', async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const tasks = await Task.find({ assignedTo: email });
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
