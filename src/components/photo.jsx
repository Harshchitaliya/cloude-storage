import React, { useEffect, useState } from 'react';
import { ref, listAll, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';
import {   uploadBytesResumable } from 'firebase/storage';

// Utility function to check if the file is a photo
const isPhoto = (filename) => {
  const photoExtensions = ['jpg', 'jpeg', 'png', 'gif'];
  const extension = filename.split('.').pop().toLowerCase();
  return photoExtensions.includes(extension);
};

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

    return photoURLs.filter(photo => photo !== null && isPhoto(photo.name));
  } catch (error) {
    console.error('Error fetching photos:', error);
    return [];
  }
};

const PhotoGallery = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null); // Tracks which menu is open

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

 

  const handleDelete = async (photo) => {
    try {
      const uid = localStorage.getItem('uid');
      const photoRef = ref(storage, `users/${uid}/${photo.name}`);
      const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/${photo.name}`);
  
      // Step 1: Download the photo content
      const response = await fetch(photo.url,{mode:'no-cors'});
      const blob = await response.blob();
  
      // Step 2: Upload the photo to the recycle bin
      const uploadResult = await uploadBytesResumable(recycleBinRef, blob);
      console.log('Photo copied to recycle bin:', uploadResult);
  
      // Step 3: Delete the original photo
      await deleteObject(photoRef);
      console.log('Original photo deleted:', photo.name);
  
      // Update the state to remove the deleted photo
      setPhotos(photos.filter(p => p.name !== photo.name));
    } catch (error) {
      console.error('Error deleting photo:', error);
    }
  };
  
  

  const handleDownload = (photo) => {
    const link = document.createElement('a');
    link.href = photo.url;
    link.download = photo.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (photo) => {
    navigator.share({
      title: 'Check out this photo',
      url: photo.url,
    }).catch(console.error);
  };

  const handleCopyLink = (photo) => {
    navigator.clipboard.writeText(photo.url)
      .then(() => alert('Link copied to clipboard'))
      .catch(console.error);
  };

  const toggleMenu = (e, photo) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === photo.name ? null : photo.name);
  };

  const closeMenu = () => {
    setMenuOpen(null);
  };

  useEffect(() => {
    window.addEventListener('click', closeMenu);
    return () => {
      window.removeEventListener('click', closeMenu);
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.galleryContainer}>
        {photos.length > 0 ? photos.map((photo, index) => (
          <div key={index} style={styles.photoContainer}>
            <img src={photo.url} alt={`Photo ${index}`} style={styles.photo} />
            <div style={styles.tripleDot} onClick={(e) => toggleMenu(e, photo)}>
              &#x22EE;
            </div>
            {menuOpen === photo.name && (
              <div className="menu" style={styles.menu} onClick={(e) => e.stopPropagation()}>
                <button style={styles.menuItem} onClick={() => handleShare(photo)}>Share</button>
                <button style={styles.menuItem} onClick={() => handleCopyLink(photo)}>Copy Link</button>
                <button style={styles.menuItem} onClick={() => handleDownload(photo)}>Download</button>
                <button style={{ ...styles.menuItem, ...styles.deleteButton }} onClick={() => handleDelete(photo)}>Delete</button>
              </div>
            )}
            <div style={styles.overlay}>
              <p style={styles.photoName}>{photo.name}</p>
            </div>
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
    height: '300px',
    width: '100%',
    transition: 'transform 0.3s, box-shadow 0.3s',
  },
  tripleDot: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    zIndex: 1,
    cursor: 'pointer',
    fontSize: '24px',
  },
  menu: {
    position: 'absolute',
    top: '40px',
    right: '10px',
    zIndex: 2,
    background: '#fff',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    padding: '0',
    width: '180px',
  },
  menuItem: {
    width: '100%',
    padding: '12px 20px',
    textAlign: 'left',
    background: '#fff',
    border: 'none',
    outline: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    borderBottom: '1px solid #eee',
    color: '#333',
  },
  deleteButton: {
    color: 'red',
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
};

export default PhotoGallery;
