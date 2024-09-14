import React, { useState, useEffect } from 'react';
import { storage, db } from './firebase'; // Firebase imports
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const styles = {
  container: {
    padding: '20px',
  },
  galleryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
  },
  photoContainer: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    borderRadius: '12px',
    height: '220px', // Fixed height for uniform size
    width: '220px', // Fixed width for uniform size
    transition: 'transform 0.3s, box-shadow 0.3s',
    cursor: 'pointer',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Ensures photo covers the entire card while maintaining aspect ratio
    borderRadius: '12px',
  },
  overlay: {
    position: 'absolute',
    bottom: '0',
    background: 'rgba(0, 0, 0, 0.6)',
    color: '#fff',
    width: '100%',
    textAlign: 'center',
    padding: '10px',
    fontSize: '16px',
  },
  photoName: {
    margin: 0,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    maxWidth: '600px',
    width: '90%', // Make the modal responsive
    textAlign: 'center',
  },
  modalImage: {
    width: '100%',
    maxHeight: '400px', // Ensure the image fits within modal
    objectFit: 'cover',
    borderRadius: '10px',
  },
  modalInfo: {
    marginTop: '10px',
    textAlign: 'left',
  },
  modalInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  modalLabel: {
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: '10px',
    padding: '10px',
    backgroundColor: 'red',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
    width: '100px',
    alignSelf: 'center',
  },
};

const PhotoGallery = () => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    description: '',
    title: '',
    price: '',
    quantity: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagesData, setImagesData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  const userUID = localStorage.getItem('uid'); // Assume UID is stored in localStorage after login

  useEffect(() => {
    const fetchImagesData = async () => {
      const userDocRef = doc(db, 'Users', userUID);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        setImagesData(userDocSnap.data().images || {});
      }
    };
    fetchImagesData();
  }, [userUID]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileUpload = async () => {
    const { sku, description, title, price, quantity } = formData;

    if (!file || !sku) {
      setError('Please provide both an image and a SKU number.');
      return;
    }

    try {
      const storageRef = ref(storage, `user/${userUID}/photo/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const newEntry = {
        description,
        title,
        price,
        quantity,
        imageURL: downloadURL,
        imageName: file.name  // Adding the image name to Firestore
      };

      const userDocRef = doc(db, 'Users', userUID);
      const userDocSnap = await getDoc(userDocRef);
      let userData = userDocSnap.exists() ? userDocSnap.data() : {};

      userData.images = userData.images || {};
      userData.images[sku] = userData.images[sku] ? [...userData.images[sku], newEntry] : [newEntry];

      await setDoc(userDocRef, { images: userData.images }, { merge: true });
      setImagesData(userData.images);

      setSuccess('Photo uploaded and details saved successfully!');
      setError('');
      setFile(null);
      setFormData({ sku: '', description: '', title: '', price: '', quantity: '' });
    } catch (err) {
      setError(`Error uploading photo: ${err.message}`);
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  return (
    <div style={styles.container}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>Upload Photo</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        {['sku', 'description', 'title', 'price', 'quantity'].map((field) => (
          <input
            key={field}
            type={field === 'price' || field === 'quantity' ? 'number' : 'text'}
            name={field}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field]}
            onChange={handleInputChange}
            style={{ padding: '10px', width: '100%', maxWidth: '400px' }}
          />
        ))}
        <button onClick={handleFileUpload} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
          Upload Photo
        </button>
      </div>

      <h2 style={{ fontSize: '24px', marginBottom: '20px', textAlign: 'center' }}>Photo Gallery</h2>
      <div style={styles.galleryContainer}>
        {Object.keys(imagesData).length > 0 ? (
          Object.keys(imagesData).map((skuKey) => (
            imagesData[skuKey].map((image, index) => ( // Display all images under each SKU
              <div key={`${skuKey}-${index}`} style={styles.photoContainer} onClick={() => handleImageClick(image)}>
                <img src={image.imageURL} alt={image.title} style={styles.photo} />
                <div style={styles.overlay}>
                  <h3 style={styles.photoName}>SKU: {skuKey}</h3>
                </div>
              </div>
            ))
          ))
        ) : (
          <p>No images available.</p>
        )}
      </div>

      {selectedImage && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <img src={selectedImage.imageURL} alt={selectedImage.title} style={styles.modalImage} />
            <div style={styles.modalInfo}>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Title:</span>
                <span>{selectedImage.title}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Description:</span>
                <span>{selectedImage.description}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Price:</span>
                <span>{selectedImage.price}</span>
              </div>
              <div style={styles.modalInfoRow}>
                <span style={styles.modalLabel}>Quantity:</span>
                <span>{selectedImage.quantity}</span>
              </div>
            </div>
            <button onClick={() => setSelectedImage(null)} style={styles.closeButton}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;











