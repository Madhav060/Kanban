import React, { useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import './AuthForm.css';
import axios from 'axios';

const AuthForm = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const formRef = useRef(null);

  const toggleForm = () => {
    setForm({ name: '', email: '', password: '' });
    setIsLogin(!isLogin);
    if (document.activeElement) {
      document.activeElement.blur();
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? 'login' : 'register';

    try {
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { ...form, role: 'user' };

      const { data } = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        alert('Registered Successfully! Please Login.');
        setIsLogin(true);
      }

      setForm({ name: '', email: '', password: '' });
      if (formRef.current) {
        const inputs = formRef.current.querySelectorAll('input');
        inputs.forEach(input => input.blur());
      }

    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} ref={formRef}>
        <h2>{isLogin ? 'Login' : 'Signup'}</h2>

        {!isLogin && (
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
          minLength="5"
        />

        <button type="submit">{isLogin ? 'Login' : 'Signup'}</button>
        <p className="toggle-text" onClick={toggleForm}>
          {isLogin ? "Don't have an account? Signup" : 'Already have an account? Login'}
        </p>
      </form>
    </div>
  );
};

export default AuthForm;
