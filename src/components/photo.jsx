import React, { useEffect, useState, useRef } from 'react';
import { ref, listAll, getDownloadURL, uploadBytes } from 'firebase/storage';
import { auth, storage } from './firebase'; // Import your Firebase config

const fetchPhotos = async (uid) => {
  try {
    console.log(`Fetching photos for UID: ${uid}`);
    const storageRef = ref(storage, `users/${uid}/`);
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
        return { url, name: item.name }; // Store URL and file name
      } catch (error) {
        console.error('Error getting download URL for item:', item, error.message, error.code, error.stack);
        return null;
      }
    }));

    console.log('Photo URLs:', photoURLs);
    return photoURLs.filter(photo => photo !== null);
  } catch (error) {
    console.error('Error fetching photos:', error.message, error.code, error.stack);
    return [];
  }
};

const uploadPhoto = async (uid, file) => {
  try {
    const storageRef = ref(storage, `users/${uid}/${file.name}`);
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handlePhotoClick = (photo, event) => {
    const { clientX: left, clientY: top } = event;
    setSelectedPhoto(photo);
    setMenuPosition({ top: top + 10, left: left + 10 });
    setShowOptions(true);
  };

  const handleDownload = () => {
    if (selectedPhoto) {
      const link = document.createElement('a');
      link.href = selectedPhoto.url;
      link.download = selectedPhoto.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setShowOptions(false);
    }
  };

  const handleShare = () => {
    if (selectedPhoto) {
      navigator.share({
        title: 'Check out this photo',
        url: selectedPhoto.url,
      }).catch(console.error);
      setShowOptions(false);
    }
  };

  const handleCopyLink = () => {
    if (selectedPhoto) {
      navigator.clipboard.writeText(selectedPhoto.url)
        .then(() => {
          alert('Link copied to clipboard');
        })
        .catch(console.error);
      setShowOptions(false);
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
        {photos.length > 0 ? photos.map((photo, index) => (
          <div
            key={index}
            style={styles.photoContainer}
            onClick={(e) => handlePhotoClick(photo, e)}
          >
            <img src={photo.url} alt={`Photo ${index}`} style={styles.photo} />
          </div>
        )) : <p>No photos available</p>}
      </div>
      {showOptions && selectedPhoto && (
        <div
          ref={menuRef}
          style={{ ...styles.optionsMenu, top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
        >
          <button onClick={handleDownload}>Download</button>
          <button onClick={handleShare}>Share</button>
          <button onClick={handleCopyLink}>Copy Link</button>
          <button onClick={() => setShowOptions(false)} style={styles.closeButton}>Close</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    position: 'relative',
  },
  uploadSection: {
    marginBottom: '20px',
  },
  galleryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  photoContainer: {
    position: 'relative',
    cursor: 'pointer',
  },
  photo: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  optionsMenu: {
    position: 'absolute',
    background: 'white',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '5px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
  },
  closeButton: {
    display: 'block',
    marginTop: '10px',
    background: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    padding: '5px 10px',
  },
};

export default PhotoGallery;
