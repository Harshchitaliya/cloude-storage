// import React, { useEffect, useState, useRef } from 'react';
// import { ref, listAll, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
// import { storage } from './firebase'; // Import your Firebase config

// // Utility function to filter files by type
// const isVideo = (filename) => {
//   const videoExtensions = ['mp4', 'mov', 'avi', 'mkv']; // Add more as needed
//   const extension = filename.split('.').pop().toLowerCase();
//   return videoExtensions.includes(extension);
// };

// const fetchMediaFiles = async (uid) => {
//   try {
//     const storageRef = ref(storage, `users/${uid}/`);
//     const mediaList = await listAll(storageRef);

//     const mediaURLs = await Promise.all(mediaList.items.map(async (item) => {
//       try {
//         const url = await getDownloadURL(item);
//         return { url, name: item.name };
//       } catch (error) {
//         console.error('Error getting download URL:', error);
//         return null;
//       }
//     }));

//     return mediaURLs.filter(media => media !== null);
//   } catch (error) {
//     console.error('Error fetching media:', error);
//     return [];
//   }
// };

// const Video = () => {
//   const [videos, setVideos] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedMedia, setSelectedMedia] = useState(null);
//   const [menuOpen, setMenuOpen] = useState(null); // Tracks which menu is open
//   const menuRef = useRef(null); // Ref for the menu

//   useEffect(() => {
//     const storedUID = localStorage.getItem('uid');
//     if (storedUID) {
//       fetchMediaFiles(storedUID).then((media) => {
//         const videoFiles = media.filter(item => isVideo(item.name));  // Filter videos
//         setVideos(videoFiles);
//         setLoading(false);
//       });
//     } else {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (menuRef.current && !menuRef.current.contains(event.target)) {
//         setMenuOpen(null);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handleMediaClick = (media) => {
//     setSelectedMedia(media);
//   };

//   const handleDownload = () => {
//     if (selectedMedia) {
//       const link = document.createElement('a');
//       link.href = selectedMedia.url;
//       link.download = selectedMedia.name;
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   const handleShare = () => {
//     if (selectedMedia) {
//       navigator.share({
//         title: 'Check out this video file',
//         url: selectedMedia.url,
//       }).catch(console.error);
//     }
//   };

//   const handleCopyLink = () => {
//     if (selectedMedia) {
//       navigator.clipboard.writeText(selectedMedia.url)
//         .then(() => alert('Link copied to clipboard'))
//         .catch(console.error);
//     }
//   };

//   const handleDelete = async (video) => {
//     try {
//       const uid = localStorage.getItem('uid');
//       const videoRef = ref(storage, `users/${uid}/${video.name}`);
//       const recycleBinRef = ref(storage, `users/${uid}/recycle_bin/${video.name}`);
  
//       // Step 1: Fetch the media file as a blob
//       const response = await fetch(video.url);
//       if (!response.ok) {
//         throw new Error('Failed to fetch media file');
//       }
//       const blob = await response.blob();
  
//       // Step 2: Upload the media file to the recycle bin
//       const uploadResult = await uploadBytesResumable(recycleBinRef, blob);
//       console.log('Media file copied to recycle bin:', uploadResult);
  
//       // Step 3: Delete the original media file
//       await deleteObject(videoRef);
//       console.log('Original media file deleted:', video.name);
  
//       // Update state to reflect the deleted video
//       setVideos(videos.filter(v => v.name !== video.name));
//     } catch (error) {
//       console.error('Error deleting media file:', error);
//     }
//   };
  
  
  

//   const toggleMenu = (media) => {
//     setMenuOpen(menuOpen === media.name ? null : media.name); // Toggles the menu for a specific media
//   };

//   if (loading) {
//     return <p>Loading...</p>;
//   }

//   return (
//     <div style={styles.container}>
//       {/* Video Section */}
//       <div>
//         <h2>Videos</h2>
//         <div style={styles.galleryContainer}>
//           {videos.length > 0 ? videos.map((video, index) => (
//             <div key={index} style={styles.mediaContainer}>
//               <video src={video.url} controls style={styles.media} />
//               <div style={styles.tripleDot} onClick={() => toggleMenu(video)}>&#x22EE;</div>
//               {menuOpen === video.name && (
//                 <div ref={menuRef} style={styles.menu}>
//                   <button style={styles.menuItem} onClick={handleShare}>Share</button>
//                   <button style={styles.menuItem} onClick={handleCopyLink}>Copy Shareable Link</button>
//                   <button style={styles.menuItem} onClick={handleDownload}>Download</button>
//                   <button style={{ ...styles.menuItem, ...styles.deleteButton }} onClick={() => handleDelete(video)}>Delete</button>
//                 </div>
//               )}
//               <p style={styles.mediaName}>{video.name}</p>
//             </div>
//           )) : <p>No videos available</p>}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Reuse styles
// const styles = {
//   container: {
//     padding: '20px',
//   },
//   galleryContainer: {
//     display: 'grid',
//     gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
//     gap: '15px',
//   },
//   mediaContainer: {
//     position: 'relative',
//     backgroundColor: '#f8f9fa',
//     borderRadius: '12px',
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
//   },
//   media: {
//     width: '100%',
//     height: 'auto',
//     borderRadius: '12px',
//   },
//   tripleDot: {
//     position: 'absolute',
//     top: '10px',
//     right: '10px',
//     zIndex: 1,
//     cursor: 'pointer',
//     fontSize: '24px',
//   },
//   menu: {
//     position: 'absolute',
//     top: '40px',
//     right: '10px',
//     zIndex: 2,
//     background: '#333', // Dark background for contrast
//     border: '1px solid #444', // Slightly lighter border
//     borderRadius: '8px',
//     boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', // Darker shadow for better visibility
//     padding: '0',
//     width: '160px',
//   },
//   menuItem: {
//     padding: '10px 20px',
//     textAlign: 'left',
//     background: '#333', // Same background as menu for consistency
//     border: 'none',
//     cursor: 'pointer',
//     fontSize: '14px',
//     borderBottom: '1px solid #444', // Same as menu border
//     color: '#fff', // White text color for visibility
//   },
//   deleteButton: {
//     color: 'red',
//   },
//   mediaName: {
//     textAlign: 'center',
//     padding: '5px 0',
//   },
// };

// export default Video;


import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config


const VideoModule = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null); // For the modal popup
  const [metadata, setMetadata] = useState(null); // To edit the metadata
  const [message, setMessage] = useState(""); // For success or error messages
  const [type, settype] = useState("");

  const auth = getAuth();

  // Check if user is logged in
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        displayUserVideos(user.uid);
      } else {
        setUser(null);
      }
    });
  }, [auth]);

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload video and metadata to Firebase Storage
  const uploadVideo = async () => {
    if (user && file && sku) {
      const userFolder = `users/${user.uid}`;
      const skuFolder = `${userFolder}/${sku}`;
      const videoRef = ref(storage, `${skuFolder}/${file.name}`);
      const metadataRef = ref(storage, `${skuFolder}/${sku}.json`);

      const metadata = {
        title,
        description,
        price,
        quantity,
        type
      };

      try {
        // Upload video
        await uploadBytes(videoRef, file);

        // Upload metadata as JSON file
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
        await uploadBytes(metadataRef, metadataBlob);

        setMessage("Video and metadata uploaded successfully!");
        displayUserVideos(user.uid);
        resetFields(); // Clear the input fields after upload
      } catch (error) {
        setMessage("Upload failed. Please try again.");
      }
    } else {
      setMessage("Please log in and fill out all fields!");
    }
  };

  // Reset the input fields after a successful upload
  const resetFields = () => {
    setFile(null);
    setSku("");
    setTitle("");
    setDescription("");
    setPrice("");
    setQuantity("");
    settype("");
  };

  // Display all videos with SKU numbers
  const displayUserVideos = async (uid) => {
    const userFolderRef = ref(storage, `users/${uid}`);
    const result = await listAll(userFolderRef);

    const allVideos = await Promise.all(
      result.prefixes.map(async (skuFolderRef) => {
        const videosResult = await listAll(skuFolderRef);

        const sku = skuFolderRef.name;

        const videos = await Promise.all(
          videosResult.items.map(async (itemRef) => {
            if (!itemRef.name.endsWith(".json")) {
              const url = await getDownloadURL(itemRef);
              // Check if the file is a video with the correct extensions
              if (itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
                return { url, sku };
              }
            }
            return null;
          })
        );

        return videos.filter((vid) => vid !== null);
      })
    );

    setVideos(allVideos.flat());
  };

  // Load metadata for a specific video
  const fetchMetadata = async (video) => {
    const metadataRef = ref(storage, `users/${user.uid}/${video.sku}/${video.sku}.json`);
    try {
      const url = await getDownloadURL(metadataRef);

      // Fetch metadata through your Node.js server
      const response = await fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`);

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setMetadata(data);
    } catch (error) {
      console.error("Error fetching metadata:", error);  // Log error to the console
      setMessage("Failed to load metadata.");
    }
  };

  // Open modal for editing
  const openVideoModal = async (video) => {
    setSelectedVideo(video);
    await fetchMetadata(video); // Load metadata for editing
  };

  // Update metadata if data changes
  const updateMetadata = async () => {
    if (!metadata || !selectedVideo) return;

    const skuFolder = `users/${user.uid}/${selectedVideo.sku}`;
    const metadataRef = ref(storage, `${skuFolder}/${selectedVideo.sku}.json`);

    try {
      // Remove old metadata JSON file
      await deleteObject(metadataRef);

      // Add updated metadata JSON file
      const updatedMetadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      await uploadBytes(metadataRef, updatedMetadataBlob);

      setMessage("Metadata updated successfully!");
      setSelectedVideo(null); // Close modal after update
    } catch (error) {
      setMessage("Failed to update metadata. Please try again.");
    }
  };

  return (
    <div className="video-module">
      {user ? (
        <>
          <h1>Upload Video</h1>
          {message && <p className="message">{message}</p>}
          <div className="upload-container">
            <input type="file" onChange={handleFileChange} accept="video/*" />
            <input
              type="text"
              placeholder="SKU Number"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
              <input
              type="text"
              placeholder="type"
              value={type}
              onChange={(e) => settype(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              type="text"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              type="text"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <button onClick={uploadVideo}>Upload Video</button>
          </div>

          <h2>Your Videos</h2>
          <div className="video-gallery">
            {videos.map((video, index) => (
              <div key={index} className="video-card" onClick={() => openVideoModal(video)}>
                <video src={video.url} controls width="200" />
                <p>SKU: {video.sku}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h1>Please log in to upload videos.</h1>
      )}

      {selectedVideo && metadata && (
        <div className="modal">
          <div className="modal-content">
            <video src={selectedVideo.url} controls width="400" />
            <h3>Edit Metadata</h3>
            <input
              type="text"
              value={metadata.title || ""}
              onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
              placeholder="Title"
            />
            <input
              type="text"
              value={metadata.description || ""}
              onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
              placeholder="Description"
            />
            <input
              type="text"
              value={metadata.price || ""}
              onChange={(e) => setMetadata({ ...metadata, price: e.target.value })}
              placeholder="Price"
            />
            <input
              type="text"
              value={metadata.quantity || ""}
              onChange={(e) => setMetadata({ ...metadata, quantity: e.target.value })}
              placeholder="Quantity"
            />
            <button onClick={updateMetadata}>Save Changes</button>
            <button onClick={() => setSelectedVideo(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoModule;
