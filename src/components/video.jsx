import React, { useEffect, useState, useRef } from 'react';
import { ref, listAll, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase'; // Import your Firebase config

// Utility function to filter files by type
const isVideo = (filename) => {
  const videoExtensions = ['mp4', 'mov', 'avi', 'mkv']; // Add more as needed
  const extension = filename.split('.').pop().toLowerCase();
  return videoExtensions.includes(extension);
};

const fetchMediaFiles = async (uid) => {
  try {
    const storageRef = ref(storage, `users/${uid}/`);
    const mediaList = await listAll(storageRef);

    const mediaURLs = await Promise.all(mediaList.items.map(async (item) => {
      try {
        const url = await getDownloadURL(item);
        return { url, name: item.name };
      } catch (error) {
        console.error('Error getting download URL:', error);
        return null;
      }
    }));

    return mediaURLs.filter(media => media !== null);
  } catch (error) {
    console.error('Error fetching media:', error);
    return [];
  }
};

const Video = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null); // Tracks which menu is open
  const menuRef = useRef(null); // Ref for the menu

  useEffect(() => {
    const storedUID = localStorage.getItem('uid');
    if (storedUID) {
      fetchMediaFiles(storedUID).then((media) => {
        const videoFiles = media.filter(item => isVideo(item.name));  // Filter videos
        setVideos(videoFiles);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMediaClick = (media) => {
    setSelectedMedia(media);
  };

  const handleDownload = () => {
    if (selectedMedia) {
      const link = document.createElement('a');
      link.href = selectedMedia.url;
      link.download = selectedMedia.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (selectedMedia) {
      navigator.share({
        title: 'Check out this video file',
        url: selectedMedia.url,
      }).catch(console.error);
    }
  };

  const handleCopyLink = () => {
    if (selectedMedia) {
      navigator.clipboard.writeText(selectedMedia.url)
        .then(() => alert('Link copied to clipboard'))
        .catch(console.error);
    }
  };

  const handleDelete = async (video) => {
    try {
      const uid = localStorage.getItem('uid');
      const videoRef = ref(storage, `users/${uid}/${video.name}`);
      const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/${video.name}`);
  
      // Step 1: Fetch the media file as a blob
      const response = await fetch(video.url);
      if (!response.ok) {
        throw new Error('Failed to fetch media file');
      }
      const blob = await response.blob();
  
      // Step 2: Upload the media file to the recycle bin
      const uploadResult = await uploadBytesResumable(recycleBinRef, blob);
      console.log('Media file copied to recycle bin:', uploadResult);
  
      // Step 3: Delete the original media file
      await deleteObject(videoRef);
      console.log('Original media file deleted:', video.name);
  
      // Update state to reflect the deleted video
      setVideos(videos.filter(v => v.name !== video.name));
    } catch (error) {
      console.error('Error deleting media file:', error);
    }
  };
  
  
  

  const toggleMenu = (media) => {
    setMenuOpen(menuOpen === media.name ? null : media.name); // Toggles the menu for a specific media
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div style={styles.container}>
      {/* Video Section */}
      <div>
        <h2>Videos</h2>
        <div style={styles.galleryContainer}>
          {videos.length > 0 ? videos.map((video, index) => (
            <div key={index} style={styles.mediaContainer}>
              <video src={video.url} controls style={styles.media} />
              <div style={styles.tripleDot} onClick={() => toggleMenu(video)}>&#x22EE;</div>
              {menuOpen === video.name && (
                <div ref={menuRef} style={styles.menu}>
                  <button style={styles.menuItem} onClick={handleShare}>Share</button>
                  <button style={styles.menuItem} onClick={handleCopyLink}>Copy Shareable Link</button>
                  <button style={styles.menuItem} onClick={handleDownload}>Download</button>
                  <button style={{ ...styles.menuItem, ...styles.deleteButton }} onClick={() => handleDelete(video)}>Delete</button>
                </div>
              )}
              <p style={styles.mediaName}>{video.name}</p>
            </div>
          )) : <p>No videos available</p>}
        </div>
      </div>
    </div>
  );
};

// Reuse styles
const styles = {
  container: {
    padding: '20px',
  },
  galleryContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '15px',
  },
  mediaContainer: {
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
    background: '#333', // Dark background for contrast
    border: '1px solid #444', // Slightly lighter border
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Darker shadow for better visibility
    padding: '0',
    width: '160px',
  },
  menuItem: {
    padding: '10px 20px',
    textAlign: 'left',
    background: '#333', // Same background as menu for consistency
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    borderBottom: '1px solid #444', // Same as menu border
    color: '#fff', // White text color for visibility
  },
  deleteButton: {
    color: 'red',
  },
  mediaName: {
    textAlign: 'center',
    padding: '5px 0',
  },
};

export default Video;
