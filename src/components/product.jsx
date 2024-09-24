import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getStorage, ref, listAll, getDownloadURL, uploadString } from 'firebase/storage';
import LazyLoad from 'react-lazyload'; // Import lazyload
import '../css/Product.css';

const Product = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderContent, setFolderContent] = useState([]);
  const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
  const [metadata, setMetadata] = useState({ title: '', description: '', price: 0, quantity: 0, type: '' });

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

            if (mediaItem) {
              return getDownloadURL(mediaItem)
                .then((url) => {
                  const isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
                  return {
                    name: folderRef.name,
                    thumbnail: url, // Use URL as the thumbnail for videos for now
                    isVideo,
                  };
                })
                .catch((error) => {
                  console.error('Error fetching media URL:', error);
                  return { name: folderRef.name, thumbnail: '', isVideo: false };
                });
            } else {
              return { name: folderRef.name, thumbnail: '', isVideo: false };
            }
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
                setMetadata(data);
              })
              .catch((error) => {
                console.error('Error parsing metadata JSON:', error);
                setMetadata({ title: '', description: '', price: '', quantity: '', type: '' });
              });
          })
          .catch((error) => {
            console.error('Error fetching metadata JSON file:', error);
            setMetadata({ title: '', description: '', price: '', quantity: '', type: '' });
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
      [e.target.name]: e.target.value,
    }));
  };

  const handleSaveMetadata = () => {
    const metadataJson = JSON.stringify(metadata);
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
            <div key={folder.name} className="folder-card" onClick={() => handleFolderClick(folder.name)}>
              <div className="folder-image-container">
                {folder.isVideo ? (  
                  <video
                    src={folder.thumbnail}
                    className="folder-video-thumbnail"
                    muted
                    autoPlay
                    loop
                    loading="lazy" // Lazy loading
                    poster={folder.thumbnail} // Optional poster image
                  />
                ) : (
                  <img src={folder.thumbnail} alt={folder.name} className="folder-image" loading="lazy" /> // Lazy loading
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
              <video src={mainMedia.url} controls className="main-video" loading="lazy" />
            ) : (
              <img src={mainMedia.url} alt="Main" className="main-image" loading="lazy" />
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
            <h3>Metadata</h3>
            <label>
              Title
              <input type="text" name="title" value={metadata.title} onChange={handleMetadataChange} />
            </label>
            <label>
              Description
              <input type="text" name="description" value={metadata.description} onChange={handleMetadataChange} />
            </label>
            <label>
              Price
              <input type="number" name="price" value={metadata.price} onChange={handleMetadataChange} />
            </label>
            <label>
              Quantity
              <input type="number" name="quantity" value={metadata.quantity} onChange={handleMetadataChange} />
            </label>
            <label>
              Type
              <input type="text" name="type" value={metadata.type} onChange={handleMetadataChange} />
            </label>
            <button onClick={handleSaveMetadata}>Save Metadata</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Product;

// import React, { useEffect, useState } from 'react';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import { getStorage, ref, listAll, getDownloadURL, uploadString } from 'firebase/storage';
// import '../css/Product.css'; // Import the CSS file

// const Product = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [folders, setFolders] = useState([]);
//   const [selectedFolder, setSelectedFolder] = useState(null);
//   const [folderContent, setFolderContent] = useState([]);
//   const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
//   const [metadata, setMetadata] = useState({ title: '', description: '', price: 0, quantity: 0, type: '' });

//   const storage = getStorage();
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUser(user);
//         loadUserFolders(user);
//       } else {
//         setUser(null);
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [auth]);

//   const loadUserFolders = (user) => {
//     const userFolderRef = ref(storage, `users/${user.uid}/`);

//     listAll(userFolderRef)
//       .then((result) => {
//         const folderPromises = result.prefixes.map((folderRef) => {
//           return listAll(folderRef).then((items) => {
//             const mediaItem = items.items.find((item) =>
//               item.name.match(/\.(jpg|jpeg|png|mov|mp4)$/i)
//             );

//             if (mediaItem) {
//               return getDownloadURL(mediaItem)
//                 .then((url) => {
//                   const isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
//                   return {
//                     name: folderRef.name,
//                     thumbnail: isVideo ? url : url, // Use URL as the thumbnail for videos for now
//                     isVideo, // Video files will use the same URL for display
//                   };
//                 })
//                 .catch((error) => {
//                   console.error('Error fetching media URL:', error);
//                   return { name: folderRef.name, thumbnail: '', isVideo: false };
//                 });
//             } else {
//               return { name: folderRef.name, thumbnail: '', isVideo: false };
//             }
//           });
//         });

//         Promise.all(folderPromises)
//           .then(setFolders)
//           .catch((error) => {
//             console.error('Error loading folders: ', error);
//           });
//       })
//       .catch((error) => {
//         console.error('Error listing folders: ', error);
//       });
//   };

//   const handleFolderClick = (folderName) => {
//     const folderRef = ref(storage, `users/${user.uid}/${folderName}/`);
  
//     listAll(folderRef)
//       .then((result) => {
//         const filePromises = result.items
//           .filter((itemRef) => !itemRef.name.endsWith('.json'))
//           .map((itemRef) => {
//             return getDownloadURL(itemRef)
//               .then((url) => ({
//                 name: itemRef.name,
//                 url,
//                 type: /\.(mov|mp4)$/i.test(itemRef.name) ? 'video' : 'image',
//               }))
//               .catch((error) => {
//                 console.error('Error fetching file URL:', error);
//                 return { name: itemRef.name, url: '', type: 'image' };
//               });
//           });
  
//         Promise.all(filePromises).then((files) => {
//           setFolderContent(files);
//           setMainMedia(files[0] || { url: '', type: 'image' }); // Set the first file as main media
//         });
  
//         const metadataFileRef = ref(storage, `users/${user.uid}/${folderName}/${folderName}.json`);
//         getDownloadURL(metadataFileRef)
//           .then((url) => {
//             fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
//               .then((response) => response.json())
//               .then((data) => {
//                 setMetadata(data);
//               })
//               .catch((error) => {
//                 console.error('Error parsing metadata JSON:', error);
//                 setMetadata({ title: '', description: '', price: '', quantity: '', type: '' });
//               });
//           })
//           .catch((error) => {
//             console.error('Error fetching metadata JSON file:', error);
//             setMetadata({ title: '', description: '', price: '', quantity: '', type: '' });
//           });
//       })
//       .catch((error) => {
//         console.error('Error listing folder content: ', error);
//       });
  
//     setSelectedFolder(folderName);
//   };

//   const handleMetadataChange = (e) => {
//     setMetadata((prevMetadata) => ({
//       ...prevMetadata,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSaveMetadata = () => {
//     const metadataJson = JSON.stringify(metadata);
//     const metadataFileRef = ref(storage, `users/${user.uid}/${selectedFolder}/${selectedFolder}.json`);

//     uploadString(metadataFileRef, metadataJson, 'raw', {
//       contentType: 'application/json',
//     })
//       .then(() => {
//         alert('Metadata updated successfully!');
//       })
//       .catch((error) => {
//         console.error('Error updating metadata:', error);
//       });
//   };

//   const handleBackButtonClick = () => {
//     setSelectedFolder(null);
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <div>Please log in to view your products.</div>;
//   }

//   return (
//     <div>
//       {selectedFolder && (
//       <button className="back-button" onClick={() => setSelectedFolder(null)}>
//         Back
//       </button>
//     )}

//       {!selectedFolder ? (
//         <div className="folder-grid">
//           {folders.map((folder) => (
//             <div key={folder.name} className="folder-card" onClick={() => handleFolderClick(folder.name)}>
//               <div className="folder-image-container">
//                 {folder.isVideo ? (  
//                   <video
//                     src={folder.thumbnail}
//                     className="folder-video-thumbnail"
//                     muted
//                     autoPlay
//                     loop
//                     poster={folder.thumbnail} // Optional poster image
//                   />
//                 ) : (
//                   <img src={folder.thumbnail} alt={folder.name} className="folder-image" />
//                 )}
//               </div>
//               <div className="folder-name">{folder.name}</div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="folder-content-container">
          
//           <div className="media-content">
//             {mainMedia.type === 'video' ? (
//               <video src={mainMedia.url} controls className="main-video" />
//             ) : (
//               <img src={mainMedia.url} alt="Main" className="main-image" />
//             )}
//             <div className="thumbnail-container">
//               {folderContent.map((file) => (
//                 file.type === 'video' ? (
//                   <video
//                     key={file.name}
//                     src={file.url}
//                     className="thumbnail-video"
//                     onClick={() => setMainMedia(file)}
//                     poster={file.url}
//                     muted
//                   />
//                 ) : (
//                   <img
//                     key={file.name}
//                     src={file.url}
//                     alt={file.name}
//                     className="thumbnail-image"
//                     onClick={() => setMainMedia(file)}
//                   />
//                 )
//               ))}
//             </div>
//           </div>
//           <div className="metadata-content">
//             <h3>Metadata</h3>
//             <label>
//               Title
//               <input type="text" name="title" value={metadata.title} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Description
//               <input type="text" name="description" value={metadata.description} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Price
//               <input type="number" name="price" value={metadata.price} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Quantity
//               <input type="number" name="quantity" value={metadata.quantity} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Type
//               <input type="text" name="type" value={metadata.type} onChange={handleMetadataChange} />
//             </label>
//             <button onClick={handleSaveMetadata}>Save Metadata</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Product;
