import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskBoard from '../../components/AdminDash/AdminDash';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { act } from 'react-dom/test-utils';

// Set up Axios mock
const mock = new MockAdapter(axios);
const API_URL = 'http://localhost:5000';

const mockTasks = [
  {
    _id: '1',
    title: 'Fix bug',
    description: 'Fix login bug',
    priority: 'High',
    category: 'Bug',
    assignedTo: 'test@example.com',
    status: 'To-Do'
  },
  {
    _id: '2',
    title: 'Build feature',
    description: '',
    priority: 'Medium',
    category: 'Feature',
    assignedTo: '',
    status: 'Done'
  }
];

describe('TaskBoard Component', () => {
  beforeEach(() => {
    mock.reset();
  });

  it('renders loading spinner initially', async () => {
    mock.onGet(`${API_URL}/api/tasks/action`).reply(200, mockTasks);
    render(<TaskBoard />);
    expect(screen.getByText(/Task Manager Board/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Fix bug/i)).toBeInTheDocument();
    });
  });

  it('displays tasks from API', async () => {
    mock.onGet(`${API_URL}/api/tasks/action`).reply(200, mockTasks);
    render(<TaskBoard />);
    expect(await screen.findByText('Fix bug')).toBeInTheDocument();
    expect(screen.getByText('Build feature')).toBeInTheDocument();
  });

  it('validates form before creating task', async () => {
    mock.onGet(`${API_URL}/api/tasks/action`).reply(200, []);
    render(<TaskBoard />);

    fireEvent.click(screen.getByText(/Create New Task/i));
    await waitFor(() => {
      expect(screen.getByText(/Title is required/i)).toBeInTheDocument();
    });
  });

  it('creates a new task on valid input', async () => {
    mock.onGet(`${API_URL}/api/tasks/action`).reply(200, []);
    mock.onPost(`${API_URL}/api/tasks/action`).reply(200, {
      message: 'Task created',
      task: {
        _id: '3',
        title: 'New Task',
        description: '',
        priority: 'Low',
        category: 'Work',
        assignedTo: 'test@mail.com',
        status: 'To-Do'
      }
    });

    render(<TaskBoard />);

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/i), {
      target: { value: 'New Task' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter task description/i), {
      target: { value: 'Some description' }
    });

    fireEvent.change(screen.getByPlaceholderText(/Enter task title/i).closest('div').parentNode.querySelector('input[name="assignedTo"]'), {
      target: { value: 'test@mail.com' }
    });

    fireEvent.click(screen.getByText(/Create New Task/i));

    await waitFor(() => {
      expect(screen.getByText(/Task created successfully/i)).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    mock.onGet(`${API_URL}/api/tasks/action`).reply(500);
    render(<TaskBoard />);
    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch tasks/i)).toBeInTheDocument();
    });
  });
});
