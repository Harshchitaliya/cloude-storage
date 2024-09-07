import React, { useState } from 'react';
import { auth, db, storage } from './firebase'; // Import Firebase config (auth, db, storage)
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { ref, uploadString } from 'firebase/storage';

const SignupForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Regex for password validation
  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*])(?=.*\d)[A-Za-z\d!@#$%^&*]{8,}$/;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Phone number validation (10 digits)
    if (!/^\d{10}$/.test(mobileNo)) {
      setError('Phone number must be 10 digits.');
      setSuccess(null);
      return;
    }

    // Password validation (at least 8 characters, 1 uppercase, 1 special char, 1 digit)
    if (!passwordRegex.test(password)) {
      setError('Password must be at least 8 characters long, include an uppercase letter, a digit, and a special character.');
      setSuccess(null);
      return;
    }

    try {
      // Check if email already exists in Firestore
      const q = query(collection(db, "Users"), where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError('Email is already in use.');
        setSuccess(null);
        return; // Stop execution if email is found
      }

      // Sign up the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      setSuccess('Sign-up successful! A verification email has been sent to your email address. Please verify your email.');
      setError(null);

      // Add user details to Firestore, initializing isEmailVerified to false
      await setDoc(doc(db, "Users", user.uid), {
        name: name,
        email: email,
        mobileNo: mobileNo,
        createdAt: new Date(),
        isEmailVerified: false, // Initially set to false
      });

      // Clear form fields after submission
      setName('');
      setEmail('');
      setPassword('');
      setMobileNo('');

      // Wait for email verification
      const checkEmailVerified = setInterval(async () => {
        await user.reload(); // Reload user to get updated email verification status
        if (user.emailVerified) {
          clearInterval(checkEmailVerified);

          // Update the user's email verification status in Firestore
          await setDoc(doc(db, "Users", user.uid), { isEmailVerified: true }, { merge: true });

          // Create a directory in Firebase Storage with the user's UID and add a dummy file
          const directoryRef = ref(storage, `${user.uid}/dummy.txt`);
          await uploadString(directoryRef, "This is a dummy file to create a directory.");

          setSuccess('Your email is verified, and data is saved!');
        }
      }, 1000); // Check every second for verification

    } catch (error) {
      setError(error.message);
      setSuccess(null);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>Sign Up</h2>

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>Name</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email</label>
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
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="mobileNo" style={styles.label}>Mobile Number</label>
          <input
            type="tel"
            id="mobileNo"
            value={mobileNo}
            onChange={(e) => setMobileNo(e.target.value)}
            style={styles.input}
            required
          />
        </div>

        <button type="submit" style={styles.button}>Sign Up</button>
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
    width: '400px',
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
  error: {
    color: 'red',
    marginBottom: '15px',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
  },
};

export default SignupForm;
