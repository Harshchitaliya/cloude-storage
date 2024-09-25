import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, listAll, getDownloadURL, uploadString } from 'firebase/storage';
import LazyLoad from 'react-lazyload';
import '../css/Product1.css'; // Ensure this file contains your styles

const Product = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderContent, setFolderContent] = useState([]);
  const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
  const [metadata, setMetadata] = useState({});

  const storage = getStorage();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        loadUserFolders(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const loadUserFolders = (user) => {
    const userFolderRef = ref(storage, `users/${user.uid}/`);

    listAll(userFolderRef)
      .then((result) => {
        const folderPromises = result.prefixes.map((folderRef) => {
          return listAll(folderRef).then((items) => {
            const mediaItem = items.items.find((item) =>
              item.name.match(/\.(jpg|jpeg|png|mov|mp4)$/i)
            );

            let folderPromise = Promise.resolve({
              name: folderRef.name,
              thumbnail: '',
              isVideo: false,
            });

            if (mediaItem) {
              folderPromise = getDownloadURL(mediaItem)
                .then((url) => {
                  const isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
                  return {
                    name: folderRef.name,
                    thumbnail: url,
                    isVideo,
                  };
                })
                .catch((error) => {
                  console.error('Error fetching media URL:', error);
                  return { name: folderRef.name, thumbnail: '', isVideo: false };
                });
            }

            // Fetch metadata for each folder
            const metadataFileRef = ref(storage, `users/${user.uid}/${folderRef.name}/${folderRef.name}.json`);
            const metadataPromise = getDownloadURL(metadataFileRef)
              .then((url) => {
                return fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
                  .then((response) => response.json())
                  .then((data) => ({
                    ...data,
                    folderName: folderRef.name,
                  }))
                  .catch((error) => {
                    console.error('Error parsing metadata JSON:', error);
                    return {
                      title: '',
                      description: '',
                      price: '',
                      quantity: '',
                      type: '',
                      folderName: folderRef.name,
                    };
                  });
              })
              .catch((error) => {
                console.error('Error fetching metadata JSON file:', error);
                return {
                  title: '',
                  description: '',
                  price: '',
                  quantity: '',
                  type: '',
                  folderName: folderRef.name,
                };
              });

            return Promise.all([folderPromise, metadataPromise]).then(([folder, metadata]) => {
              setMetadata((prevMetadata) => ({
                ...prevMetadata,
                [folderRef.name]: metadata,
              }));
              return folder;
            });
          });
        });

        Promise.all(folderPromises)
          .then(setFolders)
          .catch((error) => {
            console.error('Error loading folders: ', error);
          });
      })
      .catch((error) => {
        console.error('Error listing folders: ', error);
      });
  };

  const handleFolderClick = (folderName) => {
    const folderRef = ref(storage, `users/${user.uid}/${folderName}/`);

    listAll(folderRef)
      .then((result) => {
        const filePromises = result.items
          .filter((itemRef) => !itemRef.name.endsWith('.json'))
          .map((itemRef) => {
            return getDownloadURL(itemRef)
              .then((url) => ({
                name: itemRef.name,
                url,
                type: /\.(mov|mp4)$/i.test(itemRef.name) ? 'video' : 'image',
              }))
              .catch((error) => {
                console.error('Error fetching file URL:', error);
                return { name: itemRef.name, url: '', type: 'image' };
              });
          });

        Promise.all(filePromises).then((files) => {
          setFolderContent(files);
          setMainMedia(files[0] || { url: '', type: 'image' });
        });

        const metadataFileRef = ref(storage, `users/${user.uid}/${folderName}/${folderName}.json`);
        getDownloadURL(metadataFileRef)
          .then((url) => {
            fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
              .then((response) => response.json())
              .then((data) => {
                setMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [folderName]: data,
                }));
              })
              .catch((error) => {
                console.error('Error parsing metadata JSON:', error);
                setMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
                }));
              });
          })
          .catch((error) => {
            console.error('Error fetching metadata JSON file:', error);
            setMetadata((prevMetadata) => ({
              ...prevMetadata,
              [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
            }));
          });
      })
      .catch((error) => {
        console.error('Error listing folder content: ', error);
      });

    setSelectedFolder(folderName);
  };

  const handleMetadataChange = (e) => {
    setMetadata((prevMetadata) => ({
      ...prevMetadata,
      [selectedFolder]: {
        ...prevMetadata[selectedFolder],
        [e.target.name]: e.target.value,
      },
    }));
  };

  const handleSaveMetadata = () => {
    if (!selectedFolder) return;

    const metadataJson = JSON.stringify(metadata[selectedFolder]);
    const metadataFileRef = ref(storage, `users/${user.uid}/${selectedFolder}/${selectedFolder}.json`);

    uploadString(metadataFileRef, metadataJson, 'raw', {
      contentType: 'application/json',
    })
      .then(() => {
        alert('Metadata updated successfully!');
      })
      .catch((error) => {
        console.error('Error updating metadata:', error);
      });
  };

  const handleBackButtonClick = () => {
    setSelectedFolder(null);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to view your products.</div>;
  }

  return (
    <div>
      {selectedFolder && (
        <button className="back-button" onClick={handleBackButtonClick}>
          Back
        </button>
      )}

      {!selectedFolder ? (
        <div className="folder-grid">
          {folders.map((folder) => (
            <div key={folder.name} onClick={() => handleFolderClick(folder.name)} className="folder-card">
              <div className="folder-image-container">
                {folder.isVideo ? (
                  <video src={folder.thumbnail} className="folder-thumbnail" muted autoPlay loop poster={folder.thumbnail} />
                ) : (
                  <img src={folder.thumbnail} alt={folder.name} className="folder-thumbnail" />
                )}
              </div>
              <div className="folder-name">{folder.name}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="folder-content-container">
          <div className="media-content">
            {mainMedia.type === 'video' ? (
              <video src={mainMedia.url} controls className="main-video" />
            ) : (
              <img src={mainMedia.url} alt="Main" className="main-image" />
            )}
            <div className="thumbnail-container">
              {folderContent.map((file) => (
                <LazyLoad key={file.name} height={200} offset={100}>
                  {file.type === 'video' ? (
                    <video
                      src={file.url}
                      className="thumbnail-video"
                      onClick={() => setMainMedia(file)}
                      poster={file.url}
                      muted
                    />
                  ) : (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="thumbnail-image"
                      onClick={() => setMainMedia(file)}
                    />
                  )}
                </LazyLoad>
              ))}
            </div>
          </div>
          <div className="metadata-content">
            <h3>Metadata</h3>
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
              Price
              <input type="text" name="price" value={metadata[selectedFolder]?.price || ''} onChange={handleMetadataChange} />
            </label>
            <label>
              Quantity
              <input
                type="text"
                name="quantity"
                value={metadata[selectedFolder]?.quantity || ''}
                onChange={handleMetadataChange}
              />
            </label>
            <label>
              Type
              <input type="text" name="type" value={metadata[selectedFolder]?.type || ''} onChange={handleMetadataChange} />
            </label>
            <button className="save-button" onClick={handleSaveMetadata}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;
