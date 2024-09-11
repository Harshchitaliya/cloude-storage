import React, { useEffect, useState } from 'react';
import { ref, listAll, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase'; // Your Firebase config

const fetchRecycleBinItems = async (uid) => {
  try {
    const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/`);
    const recycleList = await listAll(recycleBinRef);

    const recycleURLs = await Promise.all(recycleList.items.map(async (item) => {
      try {
        const url = await getDownloadURL(item);
        return { url, name: item.name };
      } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
      }
    }));

    return recycleURLs.filter(item => item !== null);
  } catch (error) {
    console.error('Error fetching recycle bin items:', error);
    return [];
  }
};

const DeleteItem = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(null); // Tracks which menu is open

  useEffect(() => {
    const storedUID = localStorage.getItem('uid');
    if (storedUID) {
      fetchRecycleBinItems(storedUID).then((recycleItems) => {
        setItems(recycleItems);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleRestore = async (item) => {
    try {
      const uid = localStorage.getItem('uid');
      const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/${item.name}`);
      const originalRef = ref(storage, `users/${uid}/${item.name}`);

      // Step 1: Download the item content from recycle bin
      const response = await fetch(item.url, { mode: 'no-cors' });
      const blob = await response.blob();

      // Step 2: Upload the item back to its original location
      const uploadResult = await uploadBytesResumable(originalRef, blob);
      console.log('Item restored:', uploadResult);

      // Step 3: Delete the item from recycle bin
      await deleteObject(recycleBinRef);
      console.log('Item removed from recycle bin:', item.name);

      // Update the state to remove the restored item
      setItems(items.filter(i => i.name !== item.name));
    } catch (error) {
      console.error('Error restoring item:', error);
    }
  };

  const handleDeletePermanently = async (item) => {
    try {
      const uid = localStorage.getItem('uid');
      const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/${item.name}`);

      // Permanently delete the item from recycle bin
      await deleteObject(recycleBinRef);
      console.log('Item permanently deleted:', item.name);

      // Update the state to remove the deleted item
      setItems(items.filter(i => i.name !== item.name));
    } catch (error) {
      console.error('Error deleting item permanently:', error);
    }
  };

  const toggleMenu = (item) => {
    setMenuOpen(menuOpen === item.name ? null : item.name);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      {items.length > 0 ? (
        <div style={styles.galleryContainer}>
          {items.map((item, index) => (
            <div key={index} style={styles.itemContainer}>
              {item.url.endsWith('.mp4') || item.url.endsWith('.mov') ? (
                <video src={item.url} controls style={styles.media} />
              ) : (
                <img src={item.url} alt={`Recycle Item ${index}`} style={styles.media} />
              )}
              <div style={styles.tripleDot} onClick={() => toggleMenu(item)}>&#x22EE;</div>
              {menuOpen === item.name && (
                <div style={styles.menu}>
                  <button style={styles.menuItem} onClick={() => handleRestore(item)}>Restore</button>
                  <button style={{ ...styles.menuItem, ...styles.deleteButton }} onClick={() => handleDeletePermanently(item)}>Delete Permanently</button>
                </div>
              )}
              <p style={styles.itemName}>{item.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No items in recycle bin</p>
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
  },
  itemContainer: {
    position: 'relative',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  media: {
    width: '100%',
    height: 'auto',
    borderRadius: '12px',
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
    background: '#333',
    border: '1px solid #444',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
    padding: '0',
    width: '160px',
  },
  menuItem: {
    padding: '10px 20px',
    textAlign: 'left',
    background: '#333',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #444',
    color: '#fff',
  },
  deleteButton: {
    color: 'red',
  },
  itemName: {
    textAlign: 'center',
    padding: '5px 0',
  },
};

export default DeleteItem;
