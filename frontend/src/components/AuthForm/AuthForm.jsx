import React, { useState, useRef, useEffect } from 'react';
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
    role: 'user',
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const formRef = useRef(null);

  const toggleForm = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setForm({ name: '', email: '', password: '', role: 'user' });
      setIsLogin(!isLogin);
      setIsAnimating(false);
    }, 500);
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
        : { name: form.name, email: form.email, password: form.password, role: form.role };

      const { data } = await axios.post(`http://localhost:5000/api/auth/${endpoint}`, payload);

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = '/';
      } else {
        alert('Registered Successfully! Please Login.');
        setIsLogin(true);
      }

      setForm({ name: '', email: '', password: '', role: 'user' });
      if (formRef.current) {
        const inputs = formRef.current.querySelectorAll('input, select');
        inputs.forEach(input => input.blur());
      }

    } catch (err) {
      alert(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div className="auth-container-wrapper">
      <div className={`auth-container ${isAnimating ? 'flipping' : ''}`}>
        <div className={`auth-form ${isLogin ? 'login' : 'signup'}`}>
          <div className="form-header">
            <h2>{isLogin ? 'Welcome Back!' : 'Create Account'}</h2>
            <p>{isLogin ? 'Login to continue' : 'Join us today'}</p>
          </div>
          
          <form onSubmit={handleSubmit} ref={formRef}>
            {!isLogin && (
              <>
                <div className="input-group">
                  <input
                    type="text"
                    name="name"
                    placeholder=" "
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <label>Full Name</label>
                  <span className="input-highlight"></span>
                </div>

                <div className="input-group">
                  <select name="role" value={form.role} onChange={handleChange} required>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                  <label>Role</label>
                  <span className="input-highlight"></span>
                </div>
              </>
            )}

            <div className="input-group">
              <input
                type="email"
                name="email"
                placeholder=" "
                value={form.email}
                onChange={handleChange}
                required
              />
              <label>Email</label>
              <span className="input-highlight"></span>
            </div>

            <div className="input-group">
              <input
                type="password"
                name="password"
                placeholder=" "
                value={form.password}
                onChange={handleChange}
                required
                minLength="5"
              />
              <label>Password</label>
              <span className="input-highlight"></span>
            </div>

            <button type="submit" className="submit-btn">
              <span>{isLogin ? 'Login' : 'Sign Up'}</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <path d="M8.14645 3.14645C8.34171 2.95118 8.65829 2.95118 8.85355 3.14645L12.8536 7.14645C13.0488 7.34171 13.0488 7.65829 12.8536 7.85355L8.85355 11.8536C8.65829 12.0488 8.34171 12.0488 8.14645 11.8536C7.95118 11.6583 7.95118 11.3417 8.14645 11.1464L11.2929 8H2.5C2.22386 8 2 7.77614 2 7.5C2 7.22386 2.22386 7 2.5 7H11.2929L8.14645 3.85355C7.95118 3.65829 7.95118 3.34171 8.14645 3.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </button>
          </form>

          <div className="form-footer">
            <p>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              <button className="toggle-btn" onClick={toggleForm}>
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <div className="decoration-circle circle-1"></div>
      <div className="decoration-circle circle-2"></div>
      <div className="decoration-circle circle-3"></div>
    </div>
  );
};

export default AuthForm;