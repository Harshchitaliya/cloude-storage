import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase'; // Import your Firebase config

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        // Sign out from Firebase
        await signOut(auth);

        // Clear local storage
        localStorage.clear();

        // Redirect to login page or another page
        navigate('/login');
      } catch (error) {
        console.error('Error signing out:', error.message);
        // Optionally handle the error (e.g., show a message to the user)
      }
    };

    handleLogout();
  }, [navigate]);

  return (
    <div style={styles.container}>
      <p>Logging out...</p>
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
};

export default Logout;
