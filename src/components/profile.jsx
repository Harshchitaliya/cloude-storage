import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from './firebase'; // Ensure Firestore and Auth are correctly initialized
import '../css/ProfilePage.css'; // Assuming you create this CSS file for styling

const ProfilePage = () => {
  const [userData, setUserData] = useState({ name: '', email: '', mobileNo: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const uid = localStorage.getItem('uid');
    if (uid) {
      const fetchUserData = async () => {
        const userDocRef = doc(db, 'Users', uid);
        try {
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              name: data.name || '',
              email: data.email || '',
              mobileNo: data.mobileNo || '',
            });
            setNewEmail(data.email || '');
            setIsEmailVerified(auth.currentUser?.emailVerified); // Check if email is verified
          } else {
            setError('No such document!');
          }
        } catch (error) {
          setError('Error fetching user data');
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    } else {
      setLoading(false);
    }

    // Track email verification status in real-time
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsEmailVerified(user.emailVerified);
        if (verificationSent && user.emailVerified) {
          updateEmailInFirestore();
        }
      }
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [verificationSent]);

  const handleInputChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleEmailChange = (e) => {
    setNewEmail(e.target.value);
  };

  const handleSaveChanges = async () => {
    const uid = localStorage.getItem('uid');
    const userDocRef = doc(db, 'Users', uid);

    try {
      // Update Firestore document with name and mobileNo
      await updateDoc(userDocRef, {
        name: userData.name,
        mobileNo: userData.mobileNo,
      });

      const user = auth.currentUser;

      // If email has changed, verify the old email is verified before changing
      if (newEmail !== userData.email) {
        if (!user.emailVerified) {
          setError('Please verify your current email before changing to a new one.');
          return;
        }

        await updateEmail(user, newEmail);
        await sendEmailVerification(user); // Send email verification for the new email
        setVerificationSent(true);
        setSuccessMessage('A verification email has been sent. Please verify before we update your email.');
      } else {
        setSuccessMessage('Profile updated successfully.');
      }

      setEditing(false);
    } catch (error) {
      console.error('Error updating user data:', error);
      setError('Error updating user data. Please try again.');
    }
  };

  const updateEmailInFirestore = async () => {
    const uid = localStorage.getItem('uid');
    const userDocRef = doc(db, 'Users', uid);

    try {
      // Update Firestore with the new verified email
      await updateDoc(userDocRef, { email: newEmail });
      setSuccessMessage('Email updated successfully after verification.');
      setVerificationSent(false); // Reset verification state
    } catch (error) {
      console.error('Error updating email in Firestore:', error);
      setError('Error updating email after verification.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="profile-container">
      <h2>Profile Page</h2>
      {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}
      {editing ? (
        <div className="profile-form">
          <div>
            <label>Name:</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={newEmail}
              onChange={handleEmailChange}
            />
          </div>
          <div>
            <label>Mobile Number:</label>
            <input
              type="text"
              name="mobileNo"
              value={userData.mobileNo}
              onChange={handleInputChange}
            />
          </div>
          <button onClick={handleSaveChanges}>Save Changes</button>
          <button onClick={() => setEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className="profile-info">
          <p><strong>Name:</strong> {userData.name}</p>
          <p><strong>Email:</strong> {userData.email}</p>
          <p><strong>Mobile Number:</strong> {userData.mobileNo || 'No mobile number available'}</p>
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
