// src/tests/integration/socketIntegration.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { io } from 'socket.io-client';
import TaskBoard from '../../components/AdminDash/AdminDash';

// Mock axios
vi.mock('axios');

// Mock socket.io
vi.mock('socket.io-client');

describe('WebSocket Integration Tests', () => {
  // Mock socket instance with controllable event emitters and listeners
  let socketOnHandlers = {};
  let socketMock;
  
  beforeEach(() => {
    // Setup socket mock
    socketOnHandlers = {};
    socketMock = {
      on: vi.fn((event, handler) => {
        socketOnHandlers[event] = handler;
      }),
      emit: vi.fn(),
      off: vi.fn()
    };
    
    io.mockReturnValue(socketMock);
    
    // Default successful response for GET tasks
    axios.get.mockResolvedValue({ 
      data: [
        { 
          _id: '1', 
          title: 'Test Task 1', 
          description: 'Description 1', 
          priority: 'High', 
          category: 'Work', 
          assignedTo: 'test@example.com', 
          status: 'To-Do' 
        },
        { 
          _id: '2', 
          title: 'Test Task 2', 
          description: 'Description 2', 
          priority: 'Medium', 
          category: 'Bug', 
          assignedTo: 'test@example.com', 
          status: 'In-Progress' 
        }
      ] 
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('establishes socket connection on component mount', async () => {
    render(<TaskBoard />);
    
    // Check if socket.io client was initialized with correct URL
    expect(io).toHaveBeenCalledWith('http://localhost:5000');
    
    // Check if event listener was registered
    expect(socketMock.on).toHaveBeenCalledWith('task-updated', expect.any(Function));
  });

  it('re-fetches tasks when socket emits task-updated event', async () => {
    render(<TaskBoard />);
    
    // Wait for initial tasks to load
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Reset the get mock to track the next call
    axios.get.mockClear();
    
    // Mock new tasks data for the re-fetch
    const updatedTasks = [
      { 
        _id: '1', 
        title: 'Test Task 1 Updated', 
        description: 'Updated Description', 
        priority: 'Low', 
        category: 'Work', 
        assignedTo: 'test@example.com', 
        status: 'Done' 
      },
      { 
        _id: '2', 
        title: 'Test Task 2', 
        description: 'Description 2', 
        priority: 'Medium', 
        category: 'Bug', 
        assignedTo: 'test@example.com', 
        status: 'In-Progress' 
      }
    ];
    
    axios.get.mockResolvedValueOnce({ data: updatedTasks });
    
    // Simulate socket emitting task-updated event
    act(() => {
      socketOnHandlers['task-updated']();
    });
    
    // Check if tasks were re-fetched
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
    
    // Check if updated tasks are rendered
    await waitFor(() => {
      expect(screen.getByText('Test Task 1 Updated')).toBeInTheDocument();
    });
  });

  it('emits task-updated event when a task is created', async () => {
    // Mock successful task creation
    axios.post.mockResolvedValue({ 
      data: { 
        _id: '3', 
        title: 'New Task', 
        description: 'New Description', 
        priority: 'Medium', 
        category: 'Work', 
        assignedTo: 'test@example.com', 
        status: 'To-Do' 
      } 
    });
    
    const { getByPlaceholderText, getByText } = render(<TaskBoard />);
    
    // Wait for component to load
    await waitFor(() => {
      expect(getByText('Task Manager Board')).toBeInTheDocument();
    });
    
    // Fill out the form
    act(() => {
      fireEvent.change(getByPlaceholderText('Enter task title'), { 
        target: { value: 'New Task' } 
      });
      
      fireEvent.change(getByPlaceholderText('Enter task description'), { 
        target: { value: 'New Description' } 
      });
      
      fireEvent.change(getByPlaceholderText('Enter email address'), { 
        target: { value: 'test@example.com' } 
      });
    });
    
    // Submit the form
    act(() => {
      fireEvent.click(getByText('Add Task'));
    });
    
    // Check if socket emitted task-updated event
    await waitFor(() => {
      expect(socketMock.emit).toHaveBeenCalledWith('task-updated');
    });
  });

  it('handles disconnection and cleanup on unmount', async () => {
    const { unmount } = render(<TaskBoard />);
    
    // Wait for component to mount fully
    await waitFor(() => {
      expect(socketMock.on).toHaveBeenCalled();
    });
    
    // Unmount component
    unmount();
    
    // Check if socket listeners were removed
    expect(socketMock.off).toHaveBeenCalledWith('task-updated');
  });
});

// src/tests/integration/dragAndDrop.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import TaskBoard from '../../components/TaskBoard';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Mock axios
vi.mock('axios');

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  return {
    io: () => ({
      on: vi.fn(),
      emit: vi.fn(),
      off: vi.fn()
    })
  };
});

// Mock react-beautiful-dnd
vi.mock('@hello-pangea/dnd', () => {
  const original = vi.importActual('@hello-pangea/dnd');
  return {
    ...original,
    DragDropContext: ({ children, onDragEnd }) => {
      // Store onDragEnd callback to be called in tests
      vi.stubGlobal('mockedDragAndDropOnDragEnd', onDragEnd);
      return <div data-testid="drag-drop-context">{children}</div>;
    },
    Droppable: ({ children, droppableId }) => 
      children({
        innerRef: vi.fn(),
        droppableProps: { 'data-rbd-droppable-id': droppableId },
        placeholder: null
      }),
    Draggable: ({ children, draggableId, index }) => 
      children({
        innerRef: vi.fn(),
        draggableProps: { 'data-rbd-draggable-id': draggableId },
        dragHandleProps: { 'data-rbd-drag-handle-draggable-id': draggableId }
      })
  };
});

describe('Drag and Drop Integration Tests', () => {
  const mockTasks = [
    { 
      _id: 'task-1', 
      title: 'Test Task 1', 
      description: 'Description 1', 
      priority: 'High', 
      category: 'Work', 
      assignedTo: 'test@example.com', 
      status: 'To-Do' 
    },
    { 
      _id: 'task-2', 
      title: 'Test Task 2', 
      description: 'Description 2', 
      priority: 'Medium', 
      category: 'Bug', 
      assignedTo: 'test@example.com', 
      status: 'In-Progress' 
    }
  ];

  beforeEach(() => {
    // Default successful response for GET tasks
    axios.get.mockResolvedValue({ data: mockTasks });
    axios.put.mockResolvedValue({ data: {} });
    
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  it('renders the drag and drop context', async () => {
    render(<TaskBoard />);
    
    await waitFor(() => {
      expect(screen.getByTestId('drag-drop-context')).toBeInTheDocument();
    });
  });

  it('updates task status when dragged to a different column', async () => {
    render(<TaskBoard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    // Create a mock drag result
    const mockDragResult = {
      destination: {
        droppableId: 'In-Progress', // The column we're dropping to
        index: 0
      },
      source: {
        droppableId: 'To-Do', // The column we're dragging from
        index: 0
      },
      draggableId: 'task-1' // The task id being dragged
    };
    
    // Call the onDragEnd function directly with our mock result
    await act(async () => {
      global.mockedDragAndDropOnDragEnd(mockDragResult);
    });
    
    // Check if PUT request was made to update the task status
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        'http://localhost:5000/api/tasks/action/task-1',
        { status: 'In-Progress' }
      );
    });
  });

  it('does not update status when dragged within the same column', async () => {
    render(<TaskBoard />);
    
    // Wait for tasks to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    });
    
    // Create a mock drag result within the same column
    const mockDragResult = {
      destination: {
        droppableId: 'To-Do',
        index: 1
      },
      source: {
        droppableId: 'To-Do',
        index: 0
      },
      draggableId: 'task-1'
    };
    
    // Call the onDragEnd function directly
    await act(async () => {
      global.mockedDragAndDropOnDragEnd(mockDragResult);
    });
    
    // Check that PUT was not called as status didn't change
    expect(axios.put).not.toHaveBeenCalled();
  });
});