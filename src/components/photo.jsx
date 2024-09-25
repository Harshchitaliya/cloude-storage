// import React, { useState, useEffect } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { ref, uploadBytes, listAll, getDownloadURL, deleteObject } from "firebase/storage";
// import { storage } from "./firebase"; // Your Firebase config
// import '../css/photo.css'; // Import CSS for styling

// const PhotoModule = () => {
//   const [user, setUser] = useState(null);
//   const [file, setFile] = useState(null);
//   const [sku, setSku] = useState("");
//   const [description, setDescription] = useState("");
//   const [title, setTitle] = useState("");
//   const [price, setPrice] = useState("");
//   const [quantity, setQuantity] = useState("");
//   const [type, setType] = useState(""); // New field for 'type'
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null); // For the modal popup
//   const [metadata, setMetadata] = useState(null); // To edit the metadata
//   const [message, setMessage] = useState(""); // For success or error messages

//   const auth = getAuth();

//   // Check if user is logged in
//   useEffect(() => {
//     onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUser(user);
//         displayUserImages(user.uid);
//       } else {
//         setUser(null);
//       }
//     });
//   }, [auth]);

//   // Handle file upload
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   // Upload image and metadata to Firebase Storage
//   const uploadImage = async () => {
//     if (user && file && sku) {
//       const userFolder = `users/${user.uid}`;
//       const skuFolder = `${userFolder}/${sku}`;
//       const imageRef = ref(storage, `${skuFolder}/${file.name}`);
//       const metadataRef = ref(storage, `${skuFolder}/${sku}.json`);

//       const metadata = {
//         title,
//         type, 
//         description,
//         price,
//         quantity,
//       };

//       try {
//         // Upload image
//         await uploadBytes(imageRef, file);

//         // Upload metadata as JSON file
//         const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//         await uploadBytes(metadataRef, metadataBlob);

//         setMessage("Image and metadata uploaded successfully!");
//         displayUserImages(user.uid);
//         resetFields(); // Clear the input fields after upload
//       } catch (error) {
//         setMessage("Upload failed. Please try again.");
//       }
//     } else {
//       setMessage("Please log in and fill out all fields!");
//     }
//   };

//   // Reset the input fields after a successful upload
//   const resetFields = () => {
//     setFile(null);
//     setSku("");
//     setTitle("");
//     setType("");
//     setDescription("");
//     setPrice("");
//     setQuantity("");
//   };

//   // Display all images with SKU numbers
//   const displayUserImages = async (uid) => {
//     const userFolderRef = ref(storage, `users/${uid}`);
//     const result = await listAll(userFolderRef);

//     const allImages = await Promise.all(
//       result.prefixes.map(async (skuFolderRef) => {
//         const imagesResult = await listAll(skuFolderRef);

//         const sku = skuFolderRef.name;

//         const images = await Promise.all(
//           imagesResult.items.map(async (itemRef) => {
//             if (!itemRef.name.endsWith(".json")) {
//               const url = await getDownloadURL(itemRef);
//               // Check if the file is an image with the correct extensions
//               if (itemRef.name.match(/\.(jpeg|jpg|png)$/i)) {
//                 return { url, sku };
//               }
//             }
//             return null;
//           })
//         );

//         return images.filter((img) => img !== null);
//       })
//     );

//     setImages(allImages.flat());
//   };

//   // Load metadata for a specific image
//   const fetchMetadata = async (image) => {
//     const metadataRef = ref(storage, `users/${user.uid}/${image.sku}/${image.sku}.json`);
//     try {
//       const url = await getDownloadURL(metadataRef);
      
//       // Fetch metadata through your Node.js server
//       const response = await fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`);
      
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
      
//       const data = await response.json();
//       setMetadata(data);
//     } catch (error) {
//       console.error("Error fetching metadata:", error);  // Log error to the console
//       setMessage("Failed to load metadata.");
//     }
//   };

//   // Open modal for editing
//   const openImageModal = async (image) => {
//     setSelectedImage(image);
//     await fetchMetadata(image); // Load metadata for editing
//   };

//   // Update metadata if data changes
//   const updateMetadata = async () => {
//     if (!metadata || !selectedImage) return;

//     const skuFolder = `users/${user.uid}/${selectedImage.sku}`;
//     const metadataRef = ref(storage, `${skuFolder}/${selectedImage.sku}.json`);

//     try {
//       // Remove old metadata JSON file
//       await deleteObject(metadataRef);

//       // Add updated metadata JSON file
//       const updatedMetadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//       await uploadBytes(metadataRef, updatedMetadataBlob);

//       setMessage("Metadata updated successfully!");
//       setSelectedImage(null); // Close modal after update
//     } catch (error) {
//       setMessage("Failed to update metadata. Please try again.");
//     }
//   };

//   return (
//     <div className="photo-module">
//       {user ? (
//         <>
//           <h1>Upload Image</h1>
//           {message && <p className="message">{message}</p>} 
//           <div className="upload-container">
//             <input type="file" onChange={handleFileChange} />
//             <input
//               type="text"
//               placeholder="SKU Number"
//               value={sku}
//               onChange={(e) => setSku(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Type" 
//               value={type}
//               onChange={(e) => setType(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Description"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Price"
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Quantity"
//               value={quantity}
//               onChange={(e) => setQuantity(e.target.value)}
//             />
//             <button onClick={uploadImage}>Upload Image</button>
//           </div>

//           <h2>Your Images</h2>
//           <div className="image-gallery">
//             {images.map((image, index) => (
//               <div key={index} className="image-card" onClick={() => openImageModal(image)}>
//                 <img src={image.url} alt={`SKU: ${image.sku}`} />
//                 <p>SKU: {image.sku}</p>
//               </div>
//             ))}
//           </div>
//         </>
//       ) : (
//         <h1>Please log in to upload images.</h1>
//       )}

//       {selectedImage && metadata && (
//         <div className="modal">
//           <div className="modal-content">
//             <img src={selectedImage.url} alt="Selected" />
//             <h3>Edit Metadata</h3>
//             <input
//               type="text"
//               value={metadata.title || ""}
//               onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
//               placeholder="Title"
//             />
//             <input
//               type="text"
//               value={metadata.type || ""}
//               onChange={(e) => setMetadata({ ...metadata, type: e.target.value })}
//               placeholder="Type"
//             />
//             <input
//               type="text"
//               value={metadata.description || ""}
//               onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
//               placeholder="Description"
//             />
//             <input
//               type="text"
//               value={metadata.price || ""}
//               onChange={(e) => setMetadata({ ...metadata, price: e.target.value })}
//               placeholder="Price"
//             />
//             <input
//               type="text"
//               value={metadata.quantity || ""}
//               onChange={(e) => setMetadata({ ...metadata, quantity: e.target.value })}
//               placeholder="Quantity"
//             />
//             <button onClick={updateMetadata}>Save Changes</button>
//             <button onClick={() => setSelectedImage(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PhotoModule;



// import React, { useState, useEffect } from "react";
// import { getAuth, onAuthStateChanged } from "firebase/auth";
// import { ref, uploadBytes, listAll, getDownloadURL, deleteObject, copyObject } from "firebase/storage"; // Import copyObject for moving
// import { storage } from "./firebase"; // Your Firebase config
// import '../css/photo.css'; // Import CSS for styling


// const PhotoModule = () => {
//   const [user, setUser] = useState(null);
//   const [file, setFile] = useState(null);
//   const [sku, setSku] = useState("");
//   const [description, setDescription] = useState("");
//   const [title, setTitle] = useState("");
//   const [price, setPrice] = useState("");
//   const [quantity, setQuantity] = useState("");
//   const [type, setType] = useState(""); // New field for 'type'
//   const [images, setImages] = useState([]);
//   const [selectedImage, setSelectedImage] = useState(null); // For the modal popup
//   const [metadata, setMetadata] = useState(null); // To edit the metadata
//   const [newSku, setNewSku] = useState(""); // For changing SKU
//   const [message, setMessage] = useState(""); // For success or error messages

//   const auth = getAuth();

//   // Check if user is logged in
//   useEffect(() => {
//     onAuthStateChanged(auth, (user) => {
//       if (user) {
//         setUser(user);
//         displayUserImages(user.uid);
//       } else {
//         setUser(null);
//       }
//     });
//   }, [auth]);

//   // Handle file upload
//   const handleFileChange = (e) => {
//     setFile(e.target.files[0]);
//   };

//   // Upload image and metadata to Firebase Storage
//   const uploadImage = async () => {
//     if (user && file && sku) {
//       const userFolder = `users/${user.uid}`;
//       const skuFolder = `${userFolder}/${sku}`;
//       const imageRef = ref(storage, `${skuFolder}/${file.name}`);
//       const metadataRef = ref(storage, `${skuFolder}/${sku}.json`);

//       const metadata = {
//         title,
//         type, 
//         description,
//         price,
//         quantity,
//       };

//       try {
//         // Upload image
//         await uploadBytes(imageRef, file);

//         // Upload metadata as JSON file
//         const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//         await uploadBytes(metadataRef, metadataBlob);

//         setMessage("Image and metadata uploaded successfully!");
//         displayUserImages(user.uid);
//         resetFields(); // Clear the input fields after upload
//       } catch (error) {
//         setMessage("Upload failed. Please try again.");
//       }
//     } else {
//       setMessage("Please log in and fill out all fields!");
//     }
//   };

//   // Reset the input fields after a successful upload
//   const resetFields = () => {
//     setFile(null);
//     setSku("");
//     setTitle("");
//     setType("");
//     setDescription("");
//     setPrice("");
//     setQuantity("");
//   };

//   // Display all images with SKU numbers
//   const displayUserImages = async (uid) => {
//     const userFolderRef = ref(storage, `users/${uid}`);
//     const result = await listAll(userFolderRef);

//     const allImages = await Promise.all(
//       result.prefixes.map(async (skuFolderRef) => {
//         const imagesResult = await listAll(skuFolderRef);

//         const sku = skuFolderRef.name;

//         const images = await Promise.all(
//           imagesResult.items.map(async (itemRef) => {
//             if (!itemRef.name.endsWith(".json")) {
//               const url = await getDownloadURL(itemRef);
//               return { url, sku };
//             }
//             return null;
//           })
//         );

//         return images.filter((img) => img !== null); 
//       })
//     );

//     setImages(allImages.flat());
//   };

//   // Fetch metadata through Node.js server
//   const fetchMetadata = async (image) => {
//     const metadataRef = ref(storage, `users/${user.uid}/${image.sku}/${image.sku}.json`);
//     try {
//       const url = await getDownloadURL(metadataRef);
      
//       // Fetch metadata through Node.js server
//       const response = await fetch(`http://localhost:5001/fetch-metadata?url=${encodeURIComponent(url)}`);
      
//       if (!response.ok) {
//         throw new Error('Network response was not ok');
//       }
      
//       const data = await response.json();
//       setMetadata(data);
//       setNewSku(image.sku); // Set current SKU to state for editing
//     } catch (error) {
//       console.error("Error fetching metadata:", error);
//       setMessage("Failed to load metadata.");
//     }
//   };

//   // Open modal for editing
//   const openImageModal = async (image) => {
//     setSelectedImage(image);
//     await fetchMetadata(image); // Load metadata for editing
//   };
//   const moveImageToNewSku = async () => {
//     if (!metadata || !selectedImage || !newSku) return;

//     const oldSkuFolder = `users/${user.uid}/${selectedImage.sku}`;
//     const newSkuFolder = `users/${user.uid}/${newSku}`;
//     const oldImageName = selectedImage.url.split('/').pop().split('?')[0];
//     const oldImageRef = ref(storage, `${oldSkuFolder}/${oldImageName}`);
//     const newImageRef = ref(storage, `${newSkuFolder}/${oldImageName}`);
//     const oldMetadataRef = ref(storage, `${oldSkuFolder}/${selectedImage.sku}.json`);

//     console.log(`Old image path: ${oldImageRef.fullPath}`);
//     console.log(`New image path: ${newImageRef.fullPath}`);
//     console.log(`Old metadata path: ${oldMetadataRef.fullPath}`);
//     console.log(`Old image name: ${oldImageName}`);

//     try {
//         // Fetch and upload the image
//         const imageResponse = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(selectedImage.url)}`);
//         if (!imageResponse.ok) throw new Error("Failed to fetch image");
//         const imgBlob = await imageResponse.blob();
//         await uploadBytes(newImageRef, imgBlob);

//         // Upload metadata
//         const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
//         await uploadBytes(ref(storage, `${newSkuFolder}/${newSku}.json`), metadataBlob);

//         // List all items in the old SKU folder
//         const listResult = await listAll(ref(storage, oldSkuFolder));
//         console.log(`Items in old folder: ${listResult.items.map(item => item.fullPath)}`);
//         const photoCount = listResult.items.length;

//         // Handle deletion
//         if (photoCount === 1) {
//             try {
//                 // Delete all items in the old folder
//                 await Promise.all(listResult.items.map(item => deleteObject(item)));
//                 // Optionally delete metadata.json file
//                 try {
//                     await deleteObject(oldMetadataRef);
//                 } catch (metadataDeleteError) {
//                     console.error(`Error deleting old metadata:`, metadataDeleteError);
//                 }
//             } catch (deleteError) {
//                 console.error(`Error deleting old items:`, deleteError);
//             }
//         } else {
//             try {
//                 await deleteObject(oldImageRef);
//             } catch (deleteError) {
//                 console.error("Error deleting old image:", deleteError);
//             }
//         }

//         setMessage("Image and SKU updated successfully!");
//         setSelectedImage(null); // Close modal after update
//         displayUserImages(user.uid); // Refresh the image list
//     } catch (error) {
//         console.error("Error moving image:", error);
//         setMessage("Failed to move image. Please try again.");
//     }
// };




  
//   return (
//     <div className="photo-module">
//       {user ? (
//         <>
//           <h1>Upload Image</h1>
//           {message && <p className="message">{message}</p>} 
//           <div className="upload-container">
//             <input type="file" onChange={handleFileChange} />
//             <input
//               type="text"
//               placeholder="SKU Number"
//               value={sku}
//               onChange={(e) => setSku(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Title"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Type" 
//               value={type}
//               onChange={(e) => setType(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Description"
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Price"
//               value={price}
//               onChange={(e) => setPrice(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Quantity"
//               value={quantity}
//               onChange={(e) => setQuantity(e.target.value)}
//             />
//             <button onClick={uploadImage}>Upload Image</button>
//           </div>

//           <h2>Your Images</h2>
//           <div className="image-gallery">
//             {images.map((image, index) => (
//               <div key={index} className="image-card" onClick={() => openImageModal(image)}>
//                 <img src={image.url} alt={`SKU: ${image.sku}`} />
//                 <p>SKU: {image.sku}</p>
//               </div>
//             ))}
//           </div>
//         </>
//       ) : (
//         <h1>Please log in to upload images.</h1>
//       )}

//       {selectedImage && metadata && (
//         <div className="modal">
//           <div className="modal-content">
//             <img src={selectedImage.url} alt="Selected" />
//             <h3>Edit Metadata</h3>
//             <input
//               type="text"
//               placeholder="New SKU Number"
//               value={newSku}
//               onChange={(e) => setNewSku(e.target.value)}
//             />
//             <input
//               type="text"
//               placeholder="Title"
//               value={metadata.title}
//               onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="Type" 
//               value={metadata.type}
//               onChange={(e) => setMetadata({ ...metadata, type: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="Description"
//               value={metadata.description}
//               onChange={(e) => setMetadata({ ...metadata, description: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="Price"
//               value={metadata.price}
//               onChange={(e) => setMetadata({ ...metadata, price: e.target.value })}
//             />
//             <input
//               type="text"
//               placeholder="Quantity"
//               value={metadata.quantity}
//               onChange={(e) => setMetadata({ ...metadata, quantity: e.target.value })}
//             />
//             <button onClick={moveImageToNewSku}>Update SKU and Save</button>
//             <button onClick={() => setSelectedImage(null)}>Close</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PhotoModule;

import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, uploadBytes, listAll, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import '../css/photo.css'; // Import CSS for styling

const PhotoModule = () => {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [showMetadataFields, setShowMetadataFields] = useState(false); // To toggle metadata fields
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [type, setType] = useState(""); // New field for 'type'
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null); // For the side panel
  const [message, setMessage] = useState(""); // For success or error messages

  const auth = getAuth();

  // Check if user is logged in
  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        displayUserImages(user.uid);
      } else {
        setUser(null);
      }
    });
  }, [auth]);

  // Handle file upload
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setShowMetadataFields(true); // Show metadata fields after image selection
  };

  // Trigger the file input when the "Upload Image" button is clicked
  const handleUploadClick = () => {
    document.getElementById("fileInput").click();
  };

  // Upload image and metadata to Firebase Storage
  const uploadImage = async () => {
    if (user && file && sku) {
      const userFolder = `users/${user.uid}`;
      const skuFolder = `${userFolder}/${sku}`;
      const imageRef = ref(storage, `${skuFolder}/${file.name}`);
      const metadataRef = ref(storage, `${skuFolder}/${sku}.json`);

      const metadata = {
        title,
        type, 
        description,
        price,
        quantity,
      };

      try {
        // Upload image
        await uploadBytes(imageRef, file);

        // Upload metadata as JSON file
        const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
        await uploadBytes(metadataRef, metadataBlob);

        setMessage("Image and metadata uploaded successfully!");
        displayUserImages(user.uid);
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
    setType("");
    setDescription("");
    setPrice("");
    setQuantity("");
    setShowMetadataFields(false); // Hide metadata fields after successful upload
  };

  // Display all images with SKU numbers
  const displayUserImages = async (uid) => {
    const userFolderRef = ref(storage, `users/${uid}`);
    const result = await listAll(userFolderRef);

    const allImages = await Promise.all(
      result.prefixes.map(async (skuFolderRef) => {
        const imagesResult = await listAll(skuFolderRef);

        const sku = skuFolderRef.name;

        const images = await Promise.all(
          imagesResult.items.map(async (itemRef) => {
            if (!itemRef.name.endsWith(".json")) {
              const url = await getDownloadURL(itemRef);
              // Check if the file is an image with the correct extensions
              if (itemRef.name.match(/\.(jpeg|jpg|png)$/i)) {
                return { url, sku };
              }
            }
            return null;
          })
        );

        return images.filter((img) => img !== null);
      })
    );

    setImages(allImages.flat());
  };

  // Open side panel to view image and metadata
  const openImagePanel = (image) => {
    setSelectedImage(image);
  };

  return (
    <div className="photo-module">
      {user ? (
        <>
          <h1>Upload Image</h1>
          {message && <p className="message">{message}</p>} 
          <div className="upload-container">
            <button onClick={handleUploadClick}>Choose an Image</button>
            <input
              type="file"
              id="fileInput"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {showMetadataFields && (
            <div className="metadata-container">
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
                placeholder="Type" 
                value={type}
                onChange={(e) => setType(e.target.value)}
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
              <button onClick={uploadImage}>Upload Image</button>
            </div>
          )}

          <h2>Your Images</h2>
          <div className="image-gallery">
            {images.map((image, index) => (
              <div key={index} className="image-card" onClick={() => openImagePanel(image)}>
                <img src={image.url} alt={`SKU: ${image.sku}`} />
                <p>SKU: {image.sku}</p>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h1>Please log in to upload images.</h1>
      )}

      {/* Side Panel for showing selected image */}
      {selectedImage && (
        <div className="side-panel">
          <div className="side-panel-content">
            <img src={selectedImage.url} alt="Selected" />
            <p><strong>SKU:</strong> {selectedImage.sku}</p>
            <button onClick={() => setSelectedImage(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoModule;
