import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from './firebase'; // Import your Firebase setup
import '../css/ProfilePage.css'; // Import the CSS file

const UserProfile = () => {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    video_used: 0,
    image_used: 0,
    storage_used: 0,
  });

  const [isEditing, setIsEditing] = useState({
    firstName: false,
    lastName: false,
    mobileNo: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userId = currentUser.uid; // Get the UID of the logged-in user
        await fetchUserData(userId); // Fetch user data based on UID
      } else {
        setError('Please log in'); // Show login prompt if no user is logged in
      }
      setLoading(false); // Stop loading state
    });

    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, []);

  const fetchUserData = async (userId) => {
    const userDoc = doc(db, 'Users', userId); // Reference to the user document in Firestore
    const docSnapshot = await getDoc(userDoc);

    if (docSnapshot.exists()) {
      setUser(docSnapshot.data()); // Set user data
    } else {
      setError('User data not found');
    }
  };

  const handleChange = (e) => {
    setUser({
      ...user,
      [e.target.name]: e.target.value,
    });
  };

  const enableEditing = (field) => {
    setIsEditing((prev) => ({ ...prev, [field]: true }));
  };

  const handleSave = async (field) => {
    const userId = auth.currentUser.uid; // Get the UID of the logged-in user
    const userDoc = doc(db, 'Users', userId);
    await updateDoc(userDoc, { [field]: user[field] });
    setIsEditing((prev) => ({ ...prev, [field]: false }));
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profileContainer">
      <div className="userInfoSection">
        <h1 className="heading">Personal Information</h1>
        <div className="userInfo">
          <div className="inputRow">
            <div className="field">
              <label>First Name:</label>
              {isEditing.firstName ? (
                <input
                  type="text"
                  name="firstName"
                  value={user.firstName}
                  onChange={handleChange}
                  onBlur={() => handleSave('firstName')}
                />
              ) : (
                <span onClick={() => enableEditing('firstName')}>{user.firstName || 'Click to add'}</span>
              )}
            </div>

            <div className="field">
              <label>Last Name:</label>
              {isEditing.lastName ? (
                <input
                  type="text"
                  name="lastName"
                  value={user.lastName}
                  onChange={handleChange}
                  onBlur={() => handleSave('lastName')}
                />
              ) : (
                <span onClick={() => enableEditing('lastName')}>{user.lastName || 'Click to add'}</span>
              )}
            </div>
          </div>

          <div className="inputRow">
            <div className="field">
              <label>Email:</label>
              <span>{user.email}</span>
            </div>

            <div className="field">
              <label>Mobile No:</label>
              {isEditing.mobileNo ? (
                <input
                  type="text"
                  name="mobileNo"
                  value={user.mobileNo}
                  onChange={handleChange}
                  onBlur={() => handleSave('mobileNo')}
                />
              ) : (
                <span onClick={() => enableEditing('mobileNo')}>{user.mobileNo || 'Click to add'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="storageSection">
        <h2 className="heading">Storage Information</h2>
        <div className="storageDetails">
          <div className="storageItem">
            <span>Videos Used: </span>
            <span>{user.video_used} GB</span>
          </div>
          <div className="storageItem">
            <span>Images Used: </span>
            <span>{user.image_used} GB</span>
          </div>
          <div className="storageItem">
            <span>Storage Used: </span>
            <span>{user.storage_used} GB</span>
          </div>
          <div className="progressContainer">
            <div className="progressBar" style={{ width: `${(user.storage_used / 5) * 100}%` }} />
          </div>
          <span className="storageInfo">{user.storage_used} / 5 GB used</span>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
