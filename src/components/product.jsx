
// import React, { useEffect, useState } from 'react';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import { getStorage, ref, listAll, getDownloadURL, uploadString } from 'firebase/storage';
// import LazyLoad from 'react-lazyload';
// import '../css/Product.css';

// const Product = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [folders, setFolders] = useState([]);
//   const [selectedFolder, setSelectedFolder] = useState(null);
//   const [folderContent, setFolderContent] = useState([]);
//   const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
//   const [metadata, setMetadata] = useState({});
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768); // Initialize isMobile

//   const storage = getStorage();
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       console.log('User state changed:', user); // Add this line for debugging
//       if (user) {
//         setUser(user);
//         loadUserFolders(user);
//       } else {
//         setUser(null);
//       }
//       setLoading(false);
//     });
    
//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };
  
//     window.addEventListener('resize', handleResize);
  
//     return () => {
//       unsubscribe();
//       window.removeEventListener('resize', handleResize);
//     };
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
  
//             let folderPromise = Promise.resolve({
//               name: folderRef.name,
//               thumbnail: '',
//               isVideo: false,
//             });
  
//             if (mediaItem) {
//               folderPromise = getDownloadURL(mediaItem)
//                 .then((url) => {
//                   const isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
//                   return {
//                     name: folderRef.name,
//                     thumbnail: url,
//                     isVideo,
//                   };
//                 })
//                 .catch((error) => {
//                   console.error('Error fetching media URL:', error);
//                   return { name: folderRef.name, thumbnail: '', isVideo: false };
//                 });
//             }
  
//             // Fetch metadata for each folder
//             const metadataFileRef = ref(storage, `users/${user.uid}/${folderRef.name}/${folderRef.name}.json`);
//             const metadataPromise = getDownloadURL(metadataFileRef)
//               .then((url) => {
//                 return fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
//                   .then((response) => response.json())
//                   .then((data) => ({
//                     ...data,
//                     folderName: folderRef.name,
//                   }))
//                   .catch((error) => {
//                     console.error('Error parsing metadata JSON:', error);
//                     return {
//                       title: '',
//                       description: '',
//                       price: '',
//                       quantity: '',
//                       type: '',
//                       folderName: folderRef.name,
//                     };
//                   });
//               })
//               .catch((error) => {
//                 console.error('Error fetching metadata JSON file:', error);
//                 return {
//                   title: '',
//                   description: '',
//                   price: '',
//                   quantity: '',
//                   type: '',
//                   folderName: folderRef.name,
//                 };
//               });
  
//             return Promise.all([folderPromise, metadataPromise]).then(([folder, metadata]) => {
//               setMetadata((prevMetadata) => ({
//                 ...prevMetadata,
//                 [folderRef.name]: metadata,
//               }));
//               return folder;
//             });
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
//           setMainMedia(files[0] || { url: '', type: 'image' });
//         });

//         const metadataFileRef = ref(storage, `users/${user.uid}/${folderName}/${folderName}.json`);
//         getDownloadURL(metadataFileRef)
//           .then((url) => {
//             fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
//               .then((response) => response.json())
//               .then((data) => {
//                 setMetadata((prevMetadata) => ({
//                   ...prevMetadata,
//                   [folderName]: data,
//                 }));
//               })
//               .catch((error) => {
//                 console.error('Error parsing metadata JSON:', error);
//                 setMetadata((prevMetadata) => ({
//                   ...prevMetadata,
//                   [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
//                 }));
//               });
//           })
//           .catch((error) => {
//             console.error('Error fetching metadata JSON file:', error);
//             setMetadata((prevMetadata) => ({
//               ...prevMetadata,
//               [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
//             }));
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
//       [selectedFolder]: {
//         ...prevMetadata[selectedFolder],
//         [e.target.name]: e.target.value,
//       },
//     }));
//   };

//   const handleSaveMetadata = () => {
//     if (!selectedFolder) return;

//     const metadataJson = JSON.stringify(metadata[selectedFolder]);
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
//         <button className="back-button" onClick={handleBackButtonClick}>
//           Back
//         </button>
//       )}

//       {!selectedFolder ? (
//         <>
//           {isMobile ? (
//             <div className="product-table">
//               {folders.map((folder) => (
//                 <div className="card" key={folder.name} onClick={() => handleFolderClick(folder.name)}>
//                   {folder.isVideo ? (
//                     <video src={folder.thumbnail} className="folder-thumbnail" muted autoPlay loop loading="lazy" />
//                   ) : (
//                     <img src={folder.thumbnail} alt={folder.name} className="folder-thumbnail" loading="lazy" />
//                   )}
//                   <div className="sku">{folder.name}</div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <table className="product-table">
//               <thead>
//                 <tr>
//                   <th>Media</th>
//                   <th>SKU</th>
//                   <th>Title</th>
//                   <th>Description</th>
//                   <th>Type</th>
//                   <th>Price</th>
//                   <th>Quantity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {folders.map((folder) => (
//                   <tr key={folder.name} onClick={() => handleFolderClick(folder.name)} className="table-row">
//                     <td>
//                       {folder.isVideo ? (
//                         <video src={folder.thumbnail} className="folder-video-thumbnail" muted autoPlay loop loading="lazy" />
//                       ) : (
//                         <img src={folder.thumbnail} alt={folder.name} className="folder-image" loading="lazy" />
//                       )}
//                     </td>
//                     <td>{folder.name}</td>
//                     <td>{metadata[folder.name]?.title || ''}</td>
//                     <td>{metadata[folder.name]?.description || ''}</td>
//                     <td>{metadata[folder.name]?.type || ''}</td>
//                     <td>{metadata[folder.name]?.price || ''}</td>
//                     <td>{metadata[folder.name]?.quantity || ''}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </>
//       ) : (
//         <div className="folder-content-container">
//           <div className="media-content">
//             {mainMedia.type === 'video' ? (
//               <video src={mainMedia.url} controls className="main-video" loading="lazy" />
//             ) : (
//               <img src={mainMedia.url} alt="Main" className="main-image" loading="lazy" />
//             )}
//             <div className="thumbnail-container">
//               {folderContent.map((file) => (
//                 <LazyLoad key={file.name} height={200} offset={100}>
//                   {file.type === 'video' ? (
//                     <video
//                       src={file.url}
//                       className="thumbnail-video"
//                       onClick={() => setMainMedia(file)}
//                       muted
//                       loading="lazy"
//                     />
//                   ) : (
//                     <img
//                       src={file.url}
//                       alt={file.name}
//                       className="thumbnail-image"
//                       onClick={() => setMainMedia(file)}
//                       loading="lazy"
//                     />
//                   )}
//                 </LazyLoad>
//               ))}
//             </div>
//           </div>
//           <div className="metadata-content">
//             <h3>Metadata</h3>
//             <label>
//               Title
//               <input type="text" name="title" value={metadata[selectedFolder]?.title || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Description
//               <input
//                 type="text"
//                 name="description"
//                 value={metadata[selectedFolder]?.description || ''}
//                 onChange={handleMetadataChange}
//               />
//             </label>
//             <label>
//               Type
//               <input type="text" name="type" value={metadata[selectedFolder]?.type || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Price
//               <input type="number" name="price" value={metadata[selectedFolder]?.price || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Quantity
//               <input
//                 type="number"
//                 name="quantity"
//                 value={metadata[selectedFolder]?.quantity || ''}
//                 onChange={handleMetadataChange}
//               />
//             </label>
//             <button onClick={handleSaveMetadata}>Save</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Product;




// import React, { useEffect, useState } from 'react';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import { getStorage, ref, listAll, getDownloadURL, uploadString } from 'firebase/storage';
// import LazyLoad from 'react-lazyload';
// import '../css/Product.css';

// const Product = () => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [folders, setFolders] = useState([]);
//   const [selectedFolder, setSelectedFolder] = useState(null);
//   const [folderContent, setFolderContent] = useState([]);
//   const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
//   const [metadata, setMetadata] = useState({});
//   const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
//   const [filterType, setFilterType] = useState('sku'); // Default filter type
//   const [searchTerm, setSearchTerm] = useState('');

//   const storage = getStorage();
//   const auth = getAuth();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       console.log('User state changed:', user);
//       if (user) {
//         setUser(user);
//         loadUserFolders(user);
//       } else {
//         setUser(null);
//       }
//       setLoading(false);
//     });

//     const handleResize = () => {
//       setIsMobile(window.innerWidth <= 768);
//     };

//     window.addEventListener('resize', handleResize);

//     return () => {
//       unsubscribe();
//       window.removeEventListener('resize', handleResize);
//     };
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

//             let folderPromise = Promise.resolve({
//               name: folderRef.name,
//               thumbnail: '',
//               isVideo: false,
//             });

//             if (mediaItem) {
//               folderPromise = getDownloadURL(mediaItem)
//                 .then((url) => {
//                   const isVideo = /\.(mov|mp4)$/i.test(mediaItem.name);
//                   return {
//                     name: folderRef.name,
//                     thumbnail: url,
//                     isVideo,
//                   };
//                 })
//                 .catch((error) => {
//                   console.error('Error fetching media URL:', error);
//                   return { name: folderRef.name, thumbnail: '', isVideo: false };
//                 });
//             }

//             // Fetch metadata for each folder
//             const metadataFileRef = ref(storage, `users/${user.uid}/${folderRef.name}/${folderRef.name}.json`);
//             const metadataPromise = getDownloadURL(metadataFileRef)
//               .then((url) => {
//                 return fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
//                   .then((response) => response.json())
//                   .then((data) => ({
//                     ...data,
//                     folderName: folderRef.name,
//                   }))
//                   .catch((error) => {
//                     console.error('Error parsing metadata JSON:', error);
//                     return {
//                       title: '',
//                       description: '',
//                       price: '',
//                       quantity: '',
//                       type: '',
//                       folderName: folderRef.name,
//                     };
//                   });
//               })
//               .catch((error) => {
//                 console.error('Error fetching metadata JSON file:', error);
//                 return {
//                   title: '',
//                   description: '',
//                   price: '',
//                   quantity: '',
//                   type: '',
//                   folderName: folderRef.name,
//                 };
//               });

//             return Promise.all([folderPromise, metadataPromise]).then(([folder, metadata]) => {
//               setMetadata((prevMetadata) => ({
//                 ...prevMetadata,
//                 [folderRef.name]: metadata,
//               }));
//               return folder;
//             });
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
//           setMainMedia(files[0] || { url: '', type: 'image' });
//         });

//         const metadataFileRef = ref(storage, `users/${user.uid}/${folderName}/${folderName}.json`);
//         getDownloadURL(metadataFileRef)
//           .then((url) => {
//             fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`)
//               .then((response) => response.json())
//               .then((data) => {
//                 setMetadata((prevMetadata) => ({
//                   ...prevMetadata,
//                   [folderName]: data,
//                 }));
//               })
//               .catch((error) => {
//                 console.error('Error parsing metadata JSON:', error);
//                 setMetadata((prevMetadata) => ({
//                   ...prevMetadata,
//                   [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
//                 }));
//               });
//           })
//           .catch((error) => {
//             console.error('Error fetching metadata JSON file:', error);
//             setMetadata((prevMetadata) => ({
//               ...prevMetadata,
//               [folderName]: { title: '', description: '', price: '', quantity: '', type: '' },
//             }));
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
//       [selectedFolder]: {
//         ...prevMetadata[selectedFolder],
//         [e.target.name]: e.target.value,
//       },
//     }));
//   };

//   const handleSaveMetadata = () => {
//     if (!selectedFolder) return;

//     const metadataJson = JSON.stringify(metadata[selectedFolder]);
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

//   // Filter folders based on selected criteria
//   const filteredFolders = folders.filter((folder) => {
//     const folderMetadata = metadata[folder.name] || {};
//     const valueToFilterBy = filterType === 'sku' ? folder.name : folderMetadata[filterType] || '';
//     return valueToFilterBy.toLowerCase().includes(searchTerm.toLowerCase());
//   });

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   if (!user) {
//     return <div>Please log in to view your products.</div>;
//   }

//   return (
//     <div>
//       {selectedFolder && (
//         <button className="back-button" onClick={handleBackButtonClick}>
//           Back
//         </button>
//       )}

//       {/* Conditional Rendering of the Filtering Section */}
//       {!selectedFolder && (
//         <div className="filter-container">
//           <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
//             <option value="sku">SKU</option>
//             <option value="title">Title</option>
//             <option value="type">Type</option>
//           </select>
//           <input
//             type="text"
//             placeholder={`Search by ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="filter-input"
//           />
//           <button
//             onClick={() => {
//               setSearchTerm('');
//               setFilterType('sku'); // Reset filter type to SKU
//             }}
//             className="clear-button"
//           >
//             Clear Filters
//           </button>
//         </div>
//       )}

//       {!selectedFolder ? (
//         <>
//           {isMobile ? (
//             <div className="product-table">
//               {filteredFolders.map((folder) => (
//                 <div className="card" key={folder.name} onClick={() => handleFolderClick(folder.name)}>
//                   {folder.isVideo ? (
//                     <video src={folder.thumbnail} className="folder-thumbnail" muted autoPlay loop loading="lazy" />
//                   ) : (
//                     <img src={folder.thumbnail} alt={folder.name} className="folder-thumbnail" loading="lazy" />
//                   )}
//                   <div className="sku">{folder.name}</div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <table className="product-table">
//               <thead>
//                 <tr>
//                   <th>Media</th>
//                   <th>SKU</th>
//                   <th>Title</th>
//                   <th>Description</th>
//                   <th>Type</th>
//                   <th>Price</th>
//                   <th>Quantity</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredFolders.map((folder) => (
//                   <tr key={folder.name} onClick={() => handleFolderClick(folder.name)} className="table-row">
//                     <td>
//                       {folder.isVideo ? (
//                         <video src={folder.thumbnail} className="folder-video-thumbnail" muted autoPlay loop loading="lazy" />
//                       ) : (
//                         <img src={folder.thumbnail} alt={folder.name} className="folder-image" loading="lazy" />
//                       )}
//                     </td>
//                     <td>{folder.name}</td>
//                     <td>{metadata[folder.name]?.title || ''}</td>
//                     <td>{metadata[folder.name]?.description || ''}</td>
//                     <td>{metadata[folder.name]?.type || ''}</td>
//                     <td>{metadata[folder.name]?.price || ''}</td>
//                     <td>{metadata[folder.name]?.quantity || ''}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </>
//       ) : (
//         <div className="folder-content-container">
//           <div className="media-content">
//             {mainMedia.type === 'video' ? (
//               <video src={mainMedia.url} controls className="main-video" loading="lazy" />
//             ) : (
//               <img src={mainMedia.url} alt="Main" className="main-image" loading="lazy" />
//             )}
//             <div className="thumbnail-container">
//               {folderContent.map((file) => (
//                 <LazyLoad key={file.name} height={200} offset={100}>
//                   {file.type === 'video' ? (
//                     <video
//                       src={file.url}
//                       className="thumbnail-video"
//                       onClick={() => setMainMedia(file)}
//                       muted
//                       loading="lazy"
//                     />
//                   ) : (
//                     <img
//                       src={file.url}
//                       alt={file.name}
//                       className="thumbnail-image"
//                       onClick={() => setMainMedia(file)}
//                       loading="lazy"
//                     />
//                   )}
//                 </LazyLoad>
//               ))}
//             </div>
//           </div>
//           <div className="metadata-content">
            
//             <label>
//               Title
//               <input type="text" name="title" value={metadata[selectedFolder]?.title || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Description
//               <input
//                 type="text"
//                 name="description"
//                 value={metadata[selectedFolder]?.description || ''}
//                 onChange={handleMetadataChange}
//               />
//             </label>
//             <label>
//               Type
//               <input type="text" name="type" value={metadata[selectedFolder]?.type || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Price
//               <input type="number" name="price" value={metadata[selectedFolder]?.price || ''} onChange={handleMetadataChange} />
//             </label>
//             <label>
//               Quantity
//               <input
//                 type="number"
//                 name="quantity"
//                 value={metadata[selectedFolder]?.quantity || ''}
//                 onChange={handleMetadataChange}
//               />
//             </label>
//             <button onClick={handleSaveMetadata}>Save</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Product;


import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  listAll, 
  getDownloadURL, 
  uploadString, 
  deleteObject 
} from 'firebase/storage';
import LazyLoad from 'react-lazyload';
import '../css/Product.css';

const Product = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderContent, setFolderContent] = useState([]);
  const [mainMedia, setMainMedia] = useState({ url: '', type: 'image' });
  const [metadata, setMetadata] = useState({});
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [filterType, setFilterType] = useState('sku'); // Default filter type
  const [searchTerm, setSearchTerm] = useState('');

  const storage = getStorage();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('User state changed:', user);
      if (user) {
        setUser(user);
        loadUserFolders(user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      unsubscribe();
      window.removeEventListener('resize', handleResize);
    };
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

  // Function to delete a folder recursively
  const deleteFolderRecursively = async (folderRef) => {
    try {
      const result = await listAll(folderRef);
      // Delete all files
      const deletePromises = result.items.map((item) => deleteObject(item));
      await Promise.all(deletePromises);

      // Recursively delete subfolders
      const deleteFolderPromises = result.prefixes.map((subFolderRef) => deleteFolderRecursively(subFolderRef));
      await Promise.all(deleteFolderPromises);

      console.log(`Deleted folder: ${folderRef.fullPath}`);
    } catch (error) {
      console.error(`Error deleting folder ${folderRef.fullPath}:`, error);
      throw error;
    }
  };

  const handleDeleteFolder = async (folderName) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete the SKU folder "${folderName}"? This action cannot be undone.`);
    if (!confirmDelete) return;

    const folderRef = ref(storage, `users/${user.uid}/${folderName}/`);

    try {
      await deleteFolderRecursively(folderRef);
      alert(`SKU folder "${folderName}" has been deleted successfully.`);

      // Update state to remove the deleted folder
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.name !== folderName));
      setMetadata((prevMetadata) => {
        const newMetadata = { ...prevMetadata };
        delete newMetadata[folderName];
        return newMetadata;
      });

      // If the deleted folder was selected, reset the selection
      if (selectedFolder === folderName) {
        setSelectedFolder(null);
        setFolderContent([]);
        setMainMedia({ url: '', type: 'image' });
      }
    } catch (error) {
      alert(`Failed to delete SKU folder "${folderName}". Please try again.`);
    }
  };

  // Filter folders based on selected criteria
  const filteredFolders = folders.filter((folder) => {
    const folderMetadata = metadata[folder.name] || {};
    const valueToFilterBy = filterType === 'sku' ? folder.name : folderMetadata[filterType] || '';
    return valueToFilterBy.toLowerCase().includes(searchTerm.toLowerCase());
  });

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

      {/* Conditional Rendering of the Filtering Section */}
      {!selectedFolder && (
        <div className="filter-container">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
            <option value="sku">SKU</option>
            <option value="title">Title</option>
            <option value="type">Type</option>
          </select>
          <input
            type="text"
            placeholder={`Search by ${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('sku'); // Reset filter type to SKU
            }}
            className="clear-button"
          >
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
                        Delete
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
