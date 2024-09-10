import React, { useEffect, useState, useRef } from 'react';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase'; // Import your Firebase config

const fetchPhotos = async (uid) => {
  try {
    const storageRef = ref(storage, `users/${uid}/`);
    const photoList = await listAll(storageRef);

    const photoURLs = await Promise.all(photoList.items.map(async (item) => {
      try {
        const url = await getDownloadURL(item);
        return { url, name: item.name };
      } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
      }
    }));

    return photoURLs.filter(photo => photo !== null);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    const storedUID = localStorage.getItem('uid');
    if (storedUID) {
      fetchPhotos(storedUID).then((urls) => {
        setPhotos(urls);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
  };

  const handleDownload = () => {
    if (selectedPhoto) {
      const link = document.createElement('a');
      link.href = selectedPhoto.url;
      link.download = selectedPhoto.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (selectedPhoto) {
      navigator.share({
        title: 'Check out this photo',
        url: selectedPhoto.url,
      }).catch(console.error);
    }
  };

  const handleCopyLink = () => {
    if (selectedPhoto) {
      navigator.clipboard.writeText(selectedPhoto.url)
        .then(() => alert('Link copied to clipboard'))
        .catch(console.error);
    }
  };

  const handleDelete = async () => {
    if (selectedPhoto) {
      try {
        const photoRef = ref(storage, `users/${localStorage.getItem('uid')}/${selectedPhoto.name}`);
        await deleteObject(photoRef);
        setPhotos(photos.filter(photo => photo.name !== selectedPhoto.name));
        setSelectedPhoto(null);
      } catch (error) {
        console.error('Error deleting photo:', error);
      }
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.galleryContainer}>
        {photos.length > 0 ? photos.map((photo, index) => (
          <div
            key={index}
            style={styles.photoContainer}
            onClick={() => handlePhotoClick(photo)}
          >
            <img src={photo.url} alt={`Photo ${index}`} style={styles.photo} />
            <div style={styles.overlay}>
              <p style={styles.photoName}>{photo.name}</p>
            </div>
          </div>
        )) : <p>No photos available</p>}
      </div>

      {selectedPhoto && (
        <div style={styles.card}>
          <img src={selectedPhoto.url} alt="Selected" style={styles.cardImage} />
          <p style={styles.photoName}>Photo Name: {selectedPhoto.name}</p>
          <div style={styles.cardActions}>
            <button style={styles.button} onClick={handleDownload}>Download</button>
            <button style={styles.button} onClick={handleShare}>Share</button>
            <button style={styles.button} onClick={handleCopyLink}>Copy Link</button>
            <button style={styles.button} onClick={handleDelete}>Delete</button>
            <button style={styles.closeButton} onClick={() => setSelectedPhoto(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
  },
  galleryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '10px',
  },
  photoContainer: {
    position: 'relative',
    cursor: 'pointer',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: 'auto',
    borderRadius: '10px',
  },
  overlay: {
    position: 'absolute',
    bottom: '0',
    background: 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    width: '100%',
    textAlign: 'center',
    padding: '5px',
  },
  photoName: {
    margin: 0,
  },
  card: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#fff',
    padding: '20px',
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    borderRadius: '10px',
    maxWidth: '90vw', // Ensure the card doesn't exceed the viewport width
    maxHeight: '90vh', // Ensure the card doesn't exceed the viewport height
    overflow: 'auto',  // Handle overflow if photo is larger
  },
  cardImage: {
    width: '100%',
    height: 'auto',
    maxWidth: '100%',  // Ensure the image doesn't exceed the card width
    maxHeight: '70vh', // Adjust the height to leave space for buttons
    marginBottom: '20px',
    borderRadius: '10px',
  },
  cardActions: {
    display: 'flex',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '5px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#0056b3',
  },
  closeButton: {
    marginLeft: '10px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    padding: '5px 10px',
  },
};


export default PhotoGallery;
