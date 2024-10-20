import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';
import '../css/login.css'; // Import CSS for styling
import screenshotImage from '../images/Screenshot 2024-10-12 at 16.45.18.png';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [resetError, setResetError] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('Login successful', user.uid);
      localStorage.setItem('uid', user.uid);
      navigate('/Product');
    } catch (error) {
      const errorMessage = 
        error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      setLoginError(errorMessage);
      console.log("Login error:", error.message);
    }
  };

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setResetError('');
    setResetEmailSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      console.log("Password reset email sent to:", resetEmail);
    } catch (error) {
      setResetError('Failed to send reset email. Please check the email and try again.');
      console.log("Error sending reset email:", error.message);
    }
  };

  const toggleResetForm = () => {
    setShowResetForm(!showResetForm);
    setResetError(''); // Clear any previous errors
    setResetEmailSent(false); // Reset email sent status
  };

  return (
    <div className="login-container">
      <div className="form-container">
        <div className="logo">
          <img src="https://mindrontech.in/wp-content/uploads/2023/02/cropped-mindron-logo-1.png" alt="mindron" />
        </div>
        <form onSubmit={handleSubmit}>
          <h2>Sign in to your Dashboard</h2>
          <small>Create interactive catalogs, AR visualizations, and more.</small>

          {loginError && <span className="error">{loginError}</span>}

          <div className="inputGroup">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter Your Email"
              required
            />
          </div>

          <div className="inputGroup">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Your Password"
              required
            />
          </div>

          <div className="reset-container">
            <button type="button" className="linkButton" onClick={toggleResetForm}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="primary-button">Sign in</button>

        </form>

        {showResetForm && (
  <form onSubmit={handlePasswordReset} className="reset-form">
    <h3>Reset Password</h3>
    {resetEmailSent && <span className="success">Password reset email sent!</span>}
    {resetError && <span className="error">{resetError}</span>}
    <div className="inputGroup">
      <label htmlFor="resetEmail">Enter your email</label>
      <input
        type="email"
        id="resetEmail"
        value={resetEmail}
        onChange={(e) => setResetEmail(e.target.value)}
        placeholder="Enter your email for password reset"
        required
      />
    </div>
    <button type="submit" className="primary-button">Send Reset Email</button>
    <button type="button" className="linkButton" onClick={toggleResetForm}>
      Cancel
    </button>
  </form>
)}

      </div>

      <div className="image-container">
        <img src="" alt="image" />
      </div>
    </div>
  );
};

export default LoginForm;
