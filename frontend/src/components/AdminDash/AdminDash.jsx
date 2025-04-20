import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import './AdminDash.css';

const API_URL = 'http://localhost:5000';
const socket = io(API_URL);

const statuses = ['To-Do', 'In-Progress', 'Done'];
const priorities = ['Low', 'Medium', 'High'];
const categories = ['Work', 'Personal', 'Bug', 'Feature'];

// Email validation function
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const TaskBoard = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    category: 'Work',
    assignedTo: '',
    status: 'To-Do', 
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchTasks();
    
    socket.on('task-updated', () => {
      console.log('Socket: Task updated event received');
      fetchTasks();
    });
    
    return () => {
      console.log('Disconnecting socket listeners');
      socket.off('task-updated');
    };
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      console.log('Fetching tasks from:', `${API_URL}/api/tasks/action`);
      const res = await axios.get(`${API_URL}/api/tasks/action`);
      console.log('Tasks received:', res.data);
      setTasks(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    
    // Clear the error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    setNewTask(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = {};
    
    // Title validation
    if (!newTask.title.trim()) {
      errors.title = 'Title is required';
    } else if (newTask.title.length > 100) {
      errors.title = 'Title must be less than 100 characters';
    }
    
    // AssignedTo (email) validation
    if (!newTask.assignedTo.trim()) {
      errors.assignedTo = 'Assigned To is required';
    } else if (!validateEmail(newTask.assignedTo)) {
      errors.assignedTo = 'Please enter a valid email address';
    }
    
    // Status validation
    if (!newTask.status) {
      errors.status = 'Status is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/tasks/action`, newTask);
      
      // Reset form state
      setNewTask({
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Work',
        assignedTo: '',
        status: 'To-Do', 
      });
      
      setFormErrors({});
      setSuccessMessage('Task created successfully!');
      socket.emit('task-updated');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (err) {
      if (err.response?.data?.errors) {
        const serverErrors = {};
        Object.entries(err.response.data.errors).forEach(([field, error]) => {
          serverErrors[field] = error.message;
        });
        setFormErrors(serverErrors);
      } else {
        setError(`Failed to create task: ${err.response?.data?.message || 'Server error'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleStatusChange = async (taskId, status) => {
    try {
      console.log(`Updating task ${taskId} status to ${status}`);
      const updatedTask = await axios.put(`${API_URL}/api/tasks/action/${taskId}`, { status });
      console.log('Task status updated:', updatedTask.data);
      socket.emit('task-updated');
    } catch (err) {
      console.error('Failed to update task status:', err);
      alert('Failed to update task status. Please try again.');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        console.log(`Deleting task ${taskId}`);
        await axios.delete(`${API_URL}/api/tasks/action/${taskId}`);
        console.log('Task deleted successfully');
        socket.emit('task-updated');
      } catch (err) {
        console.error('Failed to delete task:', err);
        alert('Failed to delete task. Please try again.');
      }
    }
  };

  // Handle drag end event from react-beautiful-dnd
  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If there's no destination or the item was dropped back to its original position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    // Get the new status from the destination column id
    const newStatus = destination.droppableId;
    
    try {
      // Find the task by its id
      const taskToUpdate = tasks.find(task => task._id === draggableId);
      
      if (taskToUpdate && taskToUpdate.status !== newStatus) {
        // Update task status in the backend
        await handleStatusChange(draggableId, newStatus);
        
        // Optional: You can update the local state optimistically
        const updatedTasks = tasks.map(task => {
          if (task._id === draggableId) {
            return { ...task, status: newStatus };
          }
          return task;
        });
        
        setTasks(updatedTasks);
      }
    } catch (err) {
      console.error('Error updating task status during drag:', err);
    }
  };

  const groupedTasks = statuses.reduce((acc, status) => {
    acc[status] = tasks.filter(task => task.status === status);
    return acc;
  }, {});

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'High': return '#f44336';
      default: return '#1e90ff';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Work': return '💼';
      case 'Personal': return '👤';
      case 'Bug': return '🐛';
      case 'Feature': return '✨';
      default: return '📝';
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="loading-container"><div className="loader"></div></div>;
  }

  return (
    <div className="task-board">
      <header className="dashboard-header">
        <div className="header-content">
          <h1><span className="header-icon">📋</span> Task Manager Board</h1>
          <div className="task-stats">
            <div className="stat-item"><span className="stat-value">{tasks.length}</span><span className="stat-label">Total Tasks</span></div>
            <div className="stat-item"><span className="stat-value">{groupedTasks['Done']?.length || 0}</span><span className="stat-label">Completed</span></div>
            <div className="stat-item"><span className="stat-value">{tasks.filter(t => t.priority === 'High').length}</span><span className="stat-label">High Priority</span></div>
          </div>
        </div>
      </header>

      {error && <div className="error-message"><span>⚠️</span> {error}</div>}
      {successMessage && <div className="success-message"><span>✅</span> {successMessage}</div>}

      <div className="board-container">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="task-grid">
            {statuses.map(status => (
              <div key={status} className={`status-column status-${status.toLowerCase().replace(' ', '-')}`}>
                <div className="column-header">
                  <h3>{status}</h3>
                  <span className="task-count">{groupedTasks[status]?.length || 0}</span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div 
                      className={`task-list ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {groupedTasks[status]?.length === 0 && (
                        <div className="empty-state">No tasks in {status}</div>
                      )}
                      {groupedTasks[status]?.map((task, index) => (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <div className="card-content">
                                <div className="task-header">
                                  <div className="task-title">{task.title}</div>
                                  <div className="priority-badge" style={{ backgroundColor: getPriorityColor(task.priority) }}>
                                    {task.priority}
                                  </div>
                                </div>
                                <p className="task-description">{task.description || "No description provided"}</p>
                                <div className="task-details">
                                  <div className="detail-item"><span className="category-icon">{getCategoryIcon(task.category)}</span><span>{task.category}</span></div>
                                  {task.assignedTo && (
                                    <div className="detail-item">
                                      <span className="assigned-badge">{task.assignedTo.substring(0, 1).toUpperCase()}</span>
                                      <span className="assigned-to">{task.assignedTo}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="task-actions">
                                  <select 
                                    onChange={(e) => handleStatusChange(task._id, e.target.value)} 
                                    value={task.status} 
                                    className="status-select"
                                  >
                                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <button className="delete-button" onClick={() => handleDelete(task._id)}>Delete</button>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        <div className="side-panel">
          <div className="task-form">
            <h3><span className="form-icon">➕</span> Create New Task</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Title<span className="required-asterisk">*</span></label>
                <input 
                  name="title" 
                  value={newTask.title} 
                  onChange={handleInput}
                  onFocus={() => formErrors.title && setFormErrors({...formErrors, title: ''})}
                  placeholder="Enter task title" 
                  className={`form-input ${formErrors.title ? 'input-error' : ''}`}
                  maxLength="100"
                />
                {formErrors.title && (
                  <div className="error-text">
                    <span>⚠️</span> {formErrors.title}
                  </div>
                )}
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  name="description" 
                  value={newTask.description} 
                  onChange={handleInput} 
                  placeholder="Enter task description" 
                  className="form-textarea" 
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Status<span className="required-asterisk">*</span></label>
                  <select 
                    name="status" 
                    value={newTask.status} 
                    onChange={handleInput}
                    onFocus={() => formErrors.status && setFormErrors({...formErrors, status: ''})}
                    className={`form-select ${formErrors.status ? 'input-error' : ''}`}
                  >
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {formErrors.status && (
                    <div className="error-text">
                      <span>⚠️</span> {formErrors.status}
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label>Priority<span className="required-asterisk">*</span></label>
                  <select 
                    name="priority" 
                    value={newTask.priority} 
                    onChange={handleInput} 
                    className="form-select" 
                  >
                    {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Category<span className="required-asterisk">*</span></label>
                  <select 
                    name="category" 
                    value={newTask.category} 
                    onChange={handleInput} 
                    className="form-select" 
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Assigned To<span className="required-asterisk">*</span></label>
                  <input 
                    name="assignedTo" 
                    value={newTask.assignedTo} 
                    onChange={handleInput}
                    onFocus={() => formErrors.assignedTo && setFormErrors({...formErrors, assignedTo: ''})}
                    placeholder="Enter email address" 
                    className={`form-input ${formErrors.assignedTo ? 'input-error' : ''}`}
                  />
                  {formErrors.assignedTo && (
                    <div className="error-text">
                      <span>⚠️</span> {formErrors.assignedTo}
                    </div>
                  )}
                </div>
              </div>
            
              <button 
                onClick={handleCreate} 
                className="create-button" 
                disabled={
                  !newTask.title || 
                  !newTask.status || 
                  !newTask.assignedTo ||
                  isSubmitting ||
                  Object.values(formErrors).some(error => error)
                }
              >
                {isSubmitting ? 'Creating...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskBoard;