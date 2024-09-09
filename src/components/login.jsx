import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from './firebase';
import { useNavigate } from 'react-router-dom';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userUid, setUserUid] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setUserUid(user.uid);
      console.log('Login successful');
      console.log("User UID:", user.uid);
      
      // Save UID in local storage
      localStorage.setItem('uid', user.uid);
      
      // Redirect to home page
      navigate('/');
    } catch (error) {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        setLoginError('Invalid email or password');
      } else {
        setLoginError('Login failed. Please try again.');
      }
      console.log("Login error:", error.message);
    }
  };

  useEffect(() => {
    if (userUid) {
      localStorage.setItem('uid', userUid);
    }
  }, [userUid]);

  const handlePasswordReset = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetEmailSent(true);
      console.log("Password reset email sent to:", resetEmail);
    } catch (error) {
      console.log("Error sending reset email:", error.message);
    }
  };

  const toggleResetForm = () => {
    setShowResetForm(!showResetForm);
    setResetEmailSent(false);
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Login</h2>
        {loginError && <p style={styles.error}>{loginError}</p>}
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label} htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>
        <button type="submit" style={styles.button}>Log In</button>
        {userUid && <p style={styles.uidDisplay}>Logged in as: {userUid}</p>}
        <div style={styles.resetContainer}>
          <p onClick={toggleResetForm} style={styles.toggleLink}>
            Forgot your password?
          </p>
          {showResetForm && (
            <>
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                style={styles.input}
              />
              <button type="button" style={styles.resetButton} onClick={handlePasswordReset}>
                Send Password Reset Email
              </button>
              {resetEmailSent && <p style={styles.successMessage}>Password reset email sent!</p>}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f4',
  },
  form: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#333',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333',
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
  },
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  uidDisplay: {
    marginTop: '20px',
    textAlign: 'center',
    color: '#28a745',
  },
  resetContainer: {
    marginTop: '20px',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  successMessage: {
    marginTop: '10px',
    color: '#28a745',
  },
  toggleLink: {
    color: '#007bff',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
    textAlign: 'center',
  },
};

export default LoginForm;
