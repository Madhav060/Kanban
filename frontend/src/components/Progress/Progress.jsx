import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import './Progress.css';

const API_URL = 'http://localhost:5000';
const socket = io(API_URL);

const TaskProgressPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusCounts, setStatusCounts] = useState({});
  const [priorityCounts, setPriorityCounts] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});

  // Constant arrays from the AdminDash
  const statuses = ['To-Do', 'In-Progress', 'Done'];
  const priorities = ['Low', 'Medium', 'High'];
  const categories = ['Work', 'Personal', 'Bug', 'Feature'];

  useEffect(() => {
    fetchTasks();
    
    // Set up socket listeners for real-time updates
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
      processTaskData(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Process task data for charts
  const processTaskData = (taskData) => {
    // Count tasks by status
    const statusObj = {};
    statuses.forEach(status => {
      statusObj[status] = taskData.filter(task => task.status === status).length;
    });
    setStatusCounts(statusObj);

    // Count tasks by priority
    const priorityObj = {};
    priorities.forEach(priority => {
      priorityObj[priority] = taskData.filter(task => task.priority === priority).length;
    });
    setPriorityCounts(priorityObj);

    // Count tasks by category
    const categoryObj = {};
    categories.forEach(category => {
      categoryObj[category] = taskData.filter(task => task.category === category).length;
    });
    setCategoryCounts(categoryObj);
  };

  // Prepare data for the status bar chart
  const getStatusChartData = () => {
    return statuses.map(status => ({
      name: status,
      count: statusCounts[status] || 0,
      percentage: tasks.length ? Math.round(((statusCounts[status] || 0) / tasks.length) * 100) : 0
    }));
  };

  // Prepare data for the priority pie chart
  const getPriorityChartData = () => {
    return priorities.map(priority => ({
      name: priority,
      value: priorityCounts[priority] || 0
    }));
  };

  // Prepare data for the category distribution chart
  const getCategoryChartData = () => {
    return categories.map(category => ({
      name: category,
      count: categoryCounts[category] || 0
    }));
  };

  // Prepare data for the completion progress bar - FIXED to fill from beginning
  const getCompletionData = () => {
    const completedTasks = statusCounts['Done'] || 0;
    const remainingTasks = Math.max(tasks.length - completedTasks, 0); // Ensure it doesn't go negative
    
    return {
      name: 'Tasks',
      completed: completedTasks,
      remaining: remainingTasks
    };
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0;
    const completedTasks = statusCounts['Done'] || 0;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Color mappings
  const getStatusColor = (status) => {
    switch (status) {
      case 'To-Do': return '#3498db';
      case 'In-Progress': return '#f39c12';
      case 'Done': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return '#4caf50';
      case 'Medium': return '#ff9800';
      case 'High': return '#f44336';
      default: return '#1e90ff';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Work': return '#3498db';
      case 'Personal': return '#9b59b6';
      case 'Bug': return '#e74c3c';
      case 'Feature': return '#2ecc71';
      default: return '#95a5a6';
    }
  };
  
  if (loading && tasks.length === 0) {
    return <div className="loading-container"><div className="loader"></div></div>;
  }

  return (
    <div className="task-progress-page">
      <header className="dashboard-header">
        <div className="header-content">
          <h1><span className="header-icon">📊</span> Task Progress Dashboard</h1>
          <div className="task-stats">
            <div className="stat-item">
              <span className="stat-value">{tasks.length}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{statusCounts['Done'] || 0}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{getCompletionPercentage()}%</span>
              <span className="stat-label">Completion Rate</span>
            </div>
          </div>
        </div>
      </header>

      {error && <div className="error-message"><span>⚠️</span> {error}</div>}

      <div className="charts-container">
        {/* Main Completion Progress Bar - FIXED to fill from beginning */}
        <div className="chart-card completion-chart">
  <h3>Task Completion Progress</h3>
  <ResponsiveContainer width="100%" height={120}>
    <BarChart 
      data={[getCompletionData()]}
      layout="vertical"
      margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
    >
      <XAxis type="number" domain={[0, tasks.length || 1]} hide />
      <YAxis type="category" dataKey="name" hide />
      <Tooltip 
        formatter={(value, name) => {
          if (name === 'completed') {
            return [`${value} Tasks (${Math.round((value / tasks.length) * 100)}%)`, 'Completed'];
          }
          return [`${value} Tasks`, 'Remaining'];
        }}
      />
      <Bar 
        dataKey="completed" 
        stackId="a"
        fill="#2ecc71" 
        radius={[0, 0, 0, 0]}
      />
      <Bar 
        dataKey="remaining" 
        stackId="a"
        fill="#e0e0e0" 
        radius={[0, 0, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
  
  <div className="progress-stats">
    <div className="progress-stat">
      <span className="stat-label">Completion Rate:</span>
      <span className="stat-value">{getCompletionPercentage()}%</span>
    </div>
    <div className="progress-stat">
      <span className="stat-label">Tasks Remaining:</span>
      <span className="stat-value">{tasks.length - (statusCounts['Done'] || 0)}</span>
    </div>
  </div>
</div>

        {/* Tasks by Status Distribution */}
        <div className="chart-card status-chart">
          <h3>Tasks by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart 
              data={getStatusChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'count') {
                    return [`${value} Tasks`, 'Count'];
                  } else if (name === 'percentage') {
                    return [`${value}%`, 'Percentage'];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar 
                dataKey="count" 
                name="Task Count" 
                fill="#3498db"
              >
                {getStatusChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getStatusColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          <div className="status-legend">
            {statuses.map(status => (
              <div key={status} className="legend-item">
                <span className="color-box" style={{ backgroundColor: getStatusColor(status) }}></span>
                <span className="legend-label">{status}: {statusCounts[status] || 0} tasks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="chart-card priority-chart">
          <h3>Tasks by Priority</h3>
          <div className="pie-container">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getPriorityChartData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {getPriorityChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getPriorityColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} Tasks`, 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="priority-legend">
            {priorities.map(priority => (
              <div key={priority} className="legend-item">
                <span className="color-box" style={{ backgroundColor: getPriorityColor(priority) }}></span>
                <span className="legend-label">{priority}: {priorityCounts[priority] || 0} tasks</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Category */}
        <div className="chart-card category-chart">
          <h3>Tasks by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={getCategoryChartData()}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} Tasks`, 'Count']} />
              <Legend />
              <Bar 
                dataKey="count" 
                name="Task Count"
              >
                {getCategoryChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressPage;