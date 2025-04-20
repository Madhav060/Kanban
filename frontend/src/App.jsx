import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthForm from './components/AuthForm/AuthForm';
import AdminDash from './components/AdminDash/AdminDash';
import UserDash from './components/UserDash/UserDash';
import Progress from './components/Progress/Progress';
import Navbar from './components/Navbar/Navbar';
import './index.css';

function App() {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <BrowserRouter>
      {user && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={
            user?.role === "admin" ? <AdminDash /> : user?.role === "user" ? <UserDash /> : <Navigate to="/auth" />
          }
        />
        <Route path="/progress" element={<Progress />} />
        <Route path="/auth" element={<AuthForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
