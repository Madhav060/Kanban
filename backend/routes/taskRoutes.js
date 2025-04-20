const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

router.get('/action', getTasks);
router.post('/action', createTask);
router.put('/action/:id', updateTaskStatus);
router.delete('/action/:id', deleteTask);

module.exports = router;
