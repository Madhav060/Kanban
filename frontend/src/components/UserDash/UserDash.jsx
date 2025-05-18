import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './UserDash.css';

const API_URL = 'https://kanban-b11u.onrender.com';
const statuses = ['To-Do', 'In-Progress', 'Done'];

// Initialize socket connection
const socket = io(API_URL);

const UserDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userData = JSON.parse(localStorage.getItem('user'));
  const userEmail = userData?.email;

  const fetchUserTasks = async () => {
    if (!userEmail) {
      setError('Please login to view your tasks');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching user tasks for:', userEmail);
      const res = await axios.get(`${API_URL}/api/user/my-tasks?email=${userEmail}`);
      console.log('User tasks received:', res.data);
      setTasks(res.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching user tasks:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        setError(err.response?.data?.message || 'Failed to fetch tasks');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTasks();
    
    // Set up socket event listeners
    socket.on('task-updated', () => {
      console.log('Socket: Task updated event received in user dashboard');
      fetchUserTasks();
    });
    
    // Clean up socket listeners on component unmount
    return () => {
      console.log('Disconnecting socket listeners in user dashboard');
      socket.off('task-updated');
    };
  }, [userEmail]);

  if (loading) return <div className="ud-loading">Loading your tasks...</div>;
  if (!userEmail) return <div className="ud-auth-error">Please login to view your tasks</div>;

  const priorityData = [
    { name: 'High', count: tasks.filter(t => t.priority === 'High').length },
    { name: 'Medium', count: tasks.filter(t => t.priority === 'Medium').length },
    { name: 'Low', count: tasks.filter(t => t.priority === 'Low').length }
  ];

  return (
    <div className="ud-dashboard">
      <div className="ud-header">
        <h1>My Tasks</h1>
        <p className="ud-user-email">Assigned to: {userEmail}</p>
      </div>

      {error && <div className="ud-error">{error}</div>}

      <div className="ud-stats">
        <div className="ud-stat-card">
          <h3>Total Tasks</h3>
          <p>{tasks.length}</p>
        </div>
        <div className="ud-stat-card">
          <h3>Completed</h3>
          <p>{tasks.filter(t => t.status === 'Done').length}</p>
        </div>
        <div className="ud-stat-card">
          <h3>In Progress</h3>
          <p>{tasks.filter(t => t.status === 'In-Progress').length}</p>
        </div>
      </div>

      <div className="ud-main">
        <div className="ud-board">
          {statuses.map(status => {
            const statusTasks = tasks.filter(task => task.status === status);
            return (
              <div key={status} className="ud-column">
                <h2>{status} ({statusTasks.length})</h2>
                <div className="ud-task-list">
                  {statusTasks.length === 0 ? (
                    <div className="ud-empty-state">No tasks in {status}</div>
                  ) : (
                    statusTasks.map((task) => (
                      <div key={task._id} className="ud-task-card">
                        <div className="ud-task-header">
                          <h3>{task.title}</h3>
                          <span className={`ud-priority ud-${task.priority.toLowerCase()}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="ud-description">
                          {task.description || 'No description provided'}
                        </p>
                        <div className="ud-task-footer">
                          <span className="ud-category">{task.category}</span>
                          <span className="ud-status">{task.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="ud-chart">
          <h2>Task Priority Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priorityData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;