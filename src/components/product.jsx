import React, { useEffect, useState, useCallback } from 'react';
import { 
  getStorage, 
  ref, 
  listAll, 
  getDownloadURL, 
  uploadString, 
  deleteObject ,uploadBytes
} from 'firebase/storage';
import LazyLoad from 'react-lazyload';
import '../css/Product.css';
import { useAuth } from '../contex/theam';

const Product = () => {
  const [useruid, setUseruid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderContent, setFolderContent] = useState([]);
  const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
  const [metadata, setMetadata] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filterType, setFilterType] = useState('sku'); // Default filter type
  const [searchTerm, setSearchTerm] = useState('');
  const [bgRemovedImage, setBgRemovedImage] = useState(null); // To hold the new image after background removal
  const [isProcessing, setIsProcessing] = useState(false)
  const { currentUseruid } = useAuth();
  const storage = getStorage();

  // **1. Define loadUserFolders before useEffect**
  const loadUserFolders = useCallback(async (user) => {
    const userFolderRef = ref(storage, `users/${user}/`);
    try {
      const result = await listAll(userFolderRef);
      const folderPromises = result.prefixes.map(async (folderRef) => {
        // **Exclude media items starting with 'recycle'**
        const mediaItems = await listAll(folderRef);
        const mediaItem = mediaItems.items.find((item) =>
          !item.name.toLowerCase().startsWith('recycle') &&
          item.name.match(/\.(jpg|jpeg|png|mov|mp4)$/i)
        );

        let folder = {
          name: folderRef.name,
          thumbnail: '',
          isVideo: false,
        };

        if (mediaItem) {
          const url = await getDownloadURL(mediaItem);
          folder.thumbnail = url;
          folder.isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
        }

        // Fetch metadata
        const metadataFileRef = ref(storage, `users/${user}/${folderRef.name}/${folderRef.name}.json`);
        let meta = {
          title: '',
          description: '',
          price: '',
          quantity: '',
          type: '',
          folderName: folderRef.name,
        };

        try {
          const metadataUrl = await getDownloadURL(metadataFileRef);
          const response = await fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(metadataUrl)}`);
          const data = await response.json();
          meta = { ...data, folderName: folderRef.name };
        } catch (error) {
          console.warn(`Metadata not found for folder: ${folderRef.name}`, error);
        }

        setMetadata((prev) => ({
          ...prev,
          [folderRef.name]: meta,
        }));

        return folder;
      });

      const foldersData = await Promise.all(folderPromises);
      setFolders(foldersData);
      setLoading(false); // Set loading to false after folders are loaded
    } catch (error) {
      console.error('Error loading folders: ', error);
      setLoading(false); // Ensure loading is turned off even if there's an error
    }
  }, [storage]);

  // **2. Now, use loadUserFolders inside useEffect**
  useEffect(() => {
    if (currentUseruid) {
      setUseruid(currentUseruid);
      loadUserFolders(currentUseruid);
    } else {
      setUseruid(null);
      setFolders([]);
      setMetadata({});
      setSelectedFolder(null);
      setFolderContent([]);
      setMainMedia({ url: '', type: 'image' });
    }

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentUseruid, loadUserFolders]); // Ensure loadUserFolders is in the dependency array

  // **3. Rest of the component remains the same with additional exclusion logic**
  const handleFolderClick = async (folderName) => {
    const folderRef = ref(storage, `users/${useruid}/${folderName}/`);
    try {
      const result = await listAll(folderRef);
      // **Exclude files starting with 'recycle'**
      const files = await Promise.all(
        result.items
          .filter((itemRef) => 
            !itemRef.name.endsWith('.json') &&
            !itemRef.name.toLowerCase().startsWith('recycle') // Exclude 'recycle' files
          )
          .map(async (itemRef) => {
            const url = await getDownloadURL(itemRef);
            return {
              name: itemRef.name,
              url,
              type: /\.(mov|mp4)$/i.test(itemRef.name) ? 'video' : 'image',
            };
          })
      );

      setFolderContent(files);
      setMainMedia(files[0] || { url: '', type: 'image' });

      const metadataFileRef = ref(storage, `users/${useruid}/${folderName}/${folderName}.json`);
      try {
        const metadataUrl = await getDownloadURL(metadataFileRef);
        const response = await fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(metadataUrl)}`);
        const data = await response.json();
        setMetadata((prev) => ({
          ...prev,
          [folderName]: data,
        }));
      } catch (error) {
        console.warn(`Metadata not found for folder: ${folderName}`, error);
        setMetadata((prev) => ({
          ...prev,
          [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
        }));
      }

      setSelectedFolder(folderName);
    } catch (error) {
      console.error('Error handling folder click:', error);
    }
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      [selectedFolder]: {
        ...prevMetadata[selectedFolder],
        [name]: value,
      },
    }));
  };

  const handleSaveMetadata = async () => {
    if (!selectedFolder) return;

    const metadataJson = JSON.stringify(metadata[selectedFolder]);
    const metadataFileRef = ref(storage, `users/${useruid}/${selectedFolder}/${selectedFolder}.json`);

    try {
      await uploadString(metadataFileRef, metadataJson, 'raw', { contentType: 'application/json' });
      alert('Metadata updated successfully!');
    } catch (error) {
      console.error('Error updating metadata:', error);
    }
  };

  const deleteFolderRecursively = async (folderRef) => {
    const result = await listAll(folderRef);
    await Promise.all(result.items.map((item) => deleteObject(item)));
    await Promise.all(result.prefixes.map((subFolderRef) => deleteFolderRecursively(subFolderRef)));
  };

  const handleDeleteFolder = async (folderName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the SKU folder "${folderName}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    const folderRef = ref(storage, `users/${useruid}/${folderName}/`);
    try {
      await deleteFolderRecursively(folderRef);
      alert(`SKU folder "${folderName}" has been deleted successfully.`);
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.name !== folderName));
      setMetadata((prevMetadata) => {
        const newMetadata = { ...prevMetadata };
        delete newMetadata[folderName];
        return newMetadata;
      });

      if (selectedFolder === folderName) {
        setSelectedFolder(null);
        setFolderContent([]);
        setMainMedia({ url: '', type: 'image' });
      }
    } catch (error) {
      alert(`Failed to delete SKU folder "${folderName}". Please try again.`);
    }
  };

  const filteredFolders = folders.filter((folder) => {
    const folderMetadata = metadata[folder.name] || {};
    const valueToFilterBy = filterType === 'sku' ? folder.name : folderMetadata[filterType] || '';
    return valueToFilterBy.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (!useruid) {
    return <div>Please log in to view your products.</div>;
  }




  // Handle background removal when button is clicked
  const handleBgRemove = async () => {
    if (!mainMedia.url) return;
  
    setIsProcessing(true); // Set loading state
  
    try {
      // Call the Node.js background removal endpoint
      const response = await fetch('http://localhost:5001/remove-background', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageUrl: mainMedia.url }),
      });
  
      if (!response.ok) {
        throw new Error('Background removal failed');
      }
  
      // Convert the response to a Blob and create a URL for display
      const rbgResultData = await response.blob();
      const newImageUrl = URL.createObjectURL(rbgResultData);
  
      // Set the new image for display
      setBgRemovedImage(newImageUrl);
    } catch (error) {
      console.error("Error removing background:", error);
    } finally {
      setIsProcessing(false); // Reset loading state
    }
  };
  

  // Save the background-removed image back to Firebase
  const handleKeepImage = async () => {
    if (!bgRemovedImage) return;

    // Convert the blob URL back to a file
    const response = await fetch(bgRemovedImage);
    const blob = await response.blob();

    const imageRef = ref(storage, `users/${useruid}/${selectedFolder}/${mainMedia.name}-no-bg.png`);

    try {
      // Upload the image to Firebase
      await uploadBytes(imageRef, blob);
      alert('Image saved successfully!');
      
      // Optionally, you can update the UI to reflect the saved image
      setMainMedia({ ...mainMedia, url: bgRemovedImage });
      setBgRemovedImage(null); // Clear the bgRemovedImage
    } catch (error) {
      console.error("Error saving image:", error);
    }
  };

  // Discard the background-removed image
  const handleDiscardImage = () => {
    setBgRemovedImage(null); // Clear the state to discard the image
  };

  return (
    <div>
      {selectedFolder && (
        <button className="back-button" onClick={() => setSelectedFolder(null)}>
          Back
        </button>
      )}

      {!selectedFolder && (
        <div className="filter-container">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="sku">SKU</option>
            <option value="title">Title</option>
            <option value="type">Type</option>
          </select>

          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
          
          <div className="search-container">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder={`Search by ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}     
              className="filter-input"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('sku'); // Reset filter type to SKU
            }}
            className="clear-button"
          >
            <i className="fas fa-eraser" style={{ marginRight: '8px' }}></i> 
            Clear Filters
          </button>
        </div>
      )}

      {!selectedFolder ? (
        <>
          {isMobile ? (
            <div className="product-table">
              {filteredFolders.map((folder) => (
                <div className="card" key={folder.name}>
                  <div onClick={() => handleFolderClick(folder.name)} style={{ cursor: 'pointer' }}>
                    {folder.isVideo ? (
                      <video src={folder.thumbnail} className="folder-thumbnail" muted autoPlay loop loading="lazy" />
                    ) : (
                      <img src={folder.thumbnail} alt={folder.name} className="folder-thumbnail" loading="lazy" />
                    )}
                    <div className="sku">{folder.name}</div>
                  </div>
                  <button 
                    className="delete-button" 
                    onClick={() => handleDeleteFolder(folder.name)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Media</th>
                  <th>SKU</th>
                  <th>Title</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Quantity</th>
                  <th>Actions</th> {/* New Actions Column */}
                </tr>
              </thead>
              <tbody>
                {filteredFolders.map((folder) => (
                  <tr key={folder.name} className="table-row">
                    <td onClick={() => handleFolderClick(folder.name)} style={{ cursor: 'pointer' }}>
                      {folder.isVideo ? (
                        <video src={folder.thumbnail} className="folder-video-thumbnail" muted autoPlay loop loading="lazy" />
                      ) : (
                        <img src={folder.thumbnail} alt={folder.name} className="folder-image" loading="lazy" />
                      )}
                    </td>
                    <td onClick={() => handleFolderClick(folder.name)} style={{ cursor: 'pointer' }}>{folder.name}</td>
                    <td>{metadata[folder.name]?.title || ''}</td>
                    <td>{metadata[folder.name]?.description || ''}</td>
                    <td>{metadata[folder.name]?.type || ''}</td>
                    <td>{metadata[folder.name]?.price || ''}</td>
                    <td>{metadata[folder.name]?.quantity || ''}</td>
                    <td>
                      <button 
                        className="delete-button" 
                        onClick={() => handleDeleteFolder(folder.name)}
                      >
                        Delete <i className="fas fa-trash" style={{ marginLeft: '8px' }}></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      ) : (
        <div className="folder-content-container">
          <div className="media-content">
          {mainMedia.type === 'video' ? (
          <video src={mainMedia.url} controls className="main-video" loading="lazy" />
        ) : (
          <img src={bgRemovedImage || mainMedia.url} alt="Main" className="main-image" loading="lazy" />
        )}

            <div className="button-container">
              <button className='bgremove' onClick={handleBgRemove} disabled={isProcessing}>
                {isProcessing ? 'Processing...' : 'Remove Background'}
              </button>
              
              {bgRemovedImage && (
                <div className="image-actions">
                  <button className="keep-button" onClick={handleKeepImage}>Keep</button>
                  <button className="discard-button" onClick={handleDiscardImage}>Discard</button>
                </div>
              )}
            </div>


            <div className="thumbnail-container">
              {folderContent.map((file) => (
                <LazyLoad key={file.name} height={200} offset={100}>
                  {file.type === 'video' ? (
                    <video
                      src={file.url}
                      className="thumbnail-video"
                      onClick={() => setMainMedia(file)}
                      muted
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="thumbnail-image"
                      onClick={() => setMainMedia(file)}
                      loading="lazy"
                    />
                  )}
                </LazyLoad>
              ))}
            </div>
          </div>
          <div className="metadata-content">
            <label>
              Title
              <input type="text" name="title" value={metadata[selectedFolder]?.title || ''} onChange={handleMetadataChange} />
            </label>
            <label>
              Description
              <input
                type="text"
                name="description"
                value={metadata[selectedFolder]?.description || ''}
                onChange={handleMetadataChange}
              />
            </label>
            <label>
              Type
              <input type="text" name="type" value={metadata[selectedFolder]?.type || ''} onChange={handleMetadataChange} />
            </label>
            <label>
              Price
              <input type="number" name="price" value={metadata[selectedFolder]?.price || ''} onChange={handleMetadataChange} />
            </label>
            <label>
              Quantity
              <input
                type="number"
                name="quantity"
                value={metadata[selectedFolder]?.quantity || ''}
                onChange={handleMetadataChange}
              />
            </label>
            <button onClick={handleSaveMetadata}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;

