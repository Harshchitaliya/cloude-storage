import React, { useEffect, useState } from 'react';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase'; // Import your Firebase config

const fetchPhotos = async (uid) => {
  try {
    console.log(`Fetching photos for UID: ${uid}`);
    const storageRef = ref(storage, `${uid}/`);
    console.log('Storage Reference:', storageRef);

    const photoList = await listAll(storageRef);
    console.log('Photo List:', photoList);

    if (photoList.items.length === 0) {
      console.warn('No items found at the specified path.');
    }

    const photoURLs = await Promise.all(photoList.items.map(async (item) => {
      try {
        const url = await getDownloadURL(item);
        console.log('Photo URL:', url);
        return url;
      } catch (error) {
        console.error('Error getting download URL for item:', item, error.message, error.code, error.stack);
        return null;
      }
    }));

    console.log('Photo URLs:', photoURLs);
    return photoURLs.filter(url => url !== null);
  } catch (error) {
    console.error('Error fetching photos:', error.message, error.code, error.stack);
    return [];
  }
};

const uploadPhoto = async (uid, file) => {
  try {
    const storageRef = ref(storage, `${uid}/${file.name}`);
    console.log('Uploading to:', storageRef.fullPath);
    
    // Upload file to Firebase Storage
    await uploadBytes(storageRef, file);

    // Refresh the photo gallery after upload
    const updatedPhotos = await fetchPhotos(uid);
    return updatedPhotos;
  } catch (error) {
    console.error('Error uploading photo:', error.message, error.code, error.stack);
    return [];
  }
};

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const storedUID = localStorage.getItem('uid');
    console.log('Stored UID:', storedUID);

    if (storedUID) {
      fetchPhotos(storedUID).then((urls) => {
        setPhotos(urls);
        setLoading(false);
      }).catch((error) => {
        console.error('Error in fetching photos:', error.message, error.code, error.stack);
        setPhotos([]);
        setLoading(false);
      });
    } else {
      setPhotos([]);
      setLoading(false);
    }
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const storedUID = localStorage.getItem('uid');
    if (storedUID && file) {
      setUploading(true);
      const updatedPhotos = await uploadPhoto(storedUID, file);
      setPhotos(updatedPhotos);
      setFile(null);
      setUploading(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.uploadSection}>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      </div>
      <div style={styles.galleryContainer}>
        {photos.length > 0 ? photos.map((url, index) => (
          <div key={index} style={styles.photoContainer}>
            <img src={url} alt={`Photo ${index}`} style={styles.photo} />
          </div>
        )) : <p>No photos available</p>}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  uploadSection: {
    marginBottom: '20px',
  },
  galleryContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoContainer: {
    width: 'calc(33% - 10px)', // 3 photos per row
    marginBottom: '10px',
  },
  photo: {
    width: '100%',
    height: 'auto',
  },
};

export default PhotoGallery;
