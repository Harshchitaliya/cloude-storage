import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import '../css/photo.css'; // Import CSS for styling
import { useAuth } from "../contex/theam";
import LazyLoad from 'react-lazyload'; // Lazy load library

const PhotoModule = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentUseruid } = useAuth();

  const [selectedItems, setSelectedItems] = useState(new Set()); // For selected images
  const [selectAll, setSelectAll] = useState(false); // Manage 'Select All' checkbox

  // Memoize the displayUserImages function to prevent unnecessary re-renders
  const displayUserImages = useCallback(async (uid) => {
    setLoading(true); // Show loading while fetching images
    try {
      const userFolderRef = ref(storage, `users/${uid}`);
      const result = await listAll(userFolderRef);

      const allImages = await Promise.all(
        result.prefixes.map(async (skuFolderRef) => {
          const imagesResult = await listAll(skuFolderRef);
          const sku = skuFolderRef.name;

          const images = await Promise.all(
            imagesResult.items.map(async (itemRef) => {
              if (itemRef.name.startsWith("recycle_")) return null;

              if (!itemRef.name.endsWith(".json") && itemRef.name.match(/\.(jpeg|jpg|png|webp)$/i)) {
                const url = await getDownloadURL(itemRef);
                return { url, sku, fullPath: itemRef.fullPath };
              }
              return null;
            })
          );

          return images.filter((img) => img !== null);
        })
      );

      setImages(allImages.flat());
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false); // Stop loading once images are fetched
    }
  }, []);

  useEffect(() => {
    if (currentUseruid) {
      displayUserImages(currentUseruid);
    }
  }, [currentUseruid, displayUserImages]);

  const openImagePanel = (image) => {
    setSelectedImage(image);
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
  };

  const downloadImage = (url) => {
    const link = document.createElement("a");
    link.href = url;
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    link.download = fileName || "image.jpg";
    link.click();
  };

  const deleteImage = async (image) => {
    const originalRef = ref(storage, image.fullPath);
    const recycledRef = ref(storage, `${originalRef.parent.fullPath}/recycle_${originalRef.name}`);

    try {
      const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(image.url)}`);
      const blob = await response.blob();

      await uploadBytes(recycledRef, blob);
      await deleteObject(originalRef);

      await displayUserImages(currentUseruid); // Refresh the UI
    } catch (error) {
      console.error("Error recycling the image:", error);
    }
  };

  const shareImage = async (imageUrl) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this image",
          text: "Here is an image you might like.",
          url: imageUrl,
        });
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard. You can share it manually.');
      } catch (error) {
        console.error("Clipboard copy failed:", error);
      }
    }
  };

  // Select/Unselect individual image
  const handleSelectImage = (e, image) => {
    const updatedSelection = new Set(selectedItems);
    if (e.target.checked) {
      updatedSelection.add(image);
    } else {
      updatedSelection.delete(image);
    }
    setSelectedItems(updatedSelection);
    setSelectAll(updatedSelection.size === images.length);
  };

  // Select/Unselect all images
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(images));
    } else {
      setSelectedItems(new Set());
    }
    setSelectAll(e.target.checked);
  };

  // Batch Actions
  const downloadSelected = (items) => {
    items.forEach((item) => downloadImage(item.url));
  };

  const deleteSelectedImages = async (items) => {
    setLoading(true);
    try {
      await Promise.all(Array.from(items).map((item) => deleteImage(item)));
      setSelectedItems(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error deleting selected items:", error);
    } finally {
      setLoading(false);
    }
  };

  const shareSelected = (items) => {
    items.forEach((item) => shareImage(item.url));
  };

  // Render the image gallery
  const imageGallery = useMemo(() => {
    return images.map((image, index) => (
      <LazyLoad key={index} height={200} offset={100} once>

        <div className="image-card" onClick={() => openImagePanel(image)}>

        <div className="checkbox-wrapper">
            <input
              type="checkbox"
              checked={selectedItems.has(image)}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleSelectImage(e, image)}
              className="styled-checkbox"
            />
          </div>
          
          <img src={image.url} alt={`SKU: ${image.sku}`} loading="lazy" />
          <p>SKU: {image.sku}</p>
          <div className="dropdown">
            <button className="more-options" onClick={(e) => e.stopPropagation()}>
              <span>⋮</span>
            </button>
            <div className="dropdown-menu">
              <button onClick={() => downloadImage(image.url)}>⬇ Download</button>
              <button onClick={() => deleteImage(image)}>🗑 Recycle</button>
              <button onClick={() => shareImage(image.url)}>📤 Share</button>
            </div>
          </div>
        </div>
      </LazyLoad>
    ));
  }, [images, selectedItems]);

  return (
    <div className="photo-module">
      {currentUseruid ? (
        <>
          {loading && <p>Loading images...</p>}

          {selectedItems.size > 0 && (
            <div className="batch-toolbar">
              <div className="toolbar-left">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="select-all-checkbox"
                />
                <span className="media-count">
                  {selectAll ? "All images selected" : `${selectedItems.size} selected`}
                </span>
                <button className="unselect-button" onClick={() => setSelectedItems(new Set())}>
                  Unselect
                </button>
              </div>

              <div className="toolbar-buttons">
                
                <button onClick={() => downloadSelected(selectedItems)} className="download-button">
                  ⬇ Download
                </button>
                <button onClick={() => deleteSelectedImages(selectedItems)} className="delete-button">
                  🗑 Delete
                </button>
                <button onClick={() => shareSelected(selectedItems)} className="share-button">
                  📤 Share
                </button>
              </div>
            </div>
          )}

          <div className="image-gallery">{imageGallery}</div>
        </>
      ) : (
        <h1>Please log in to view images.</h1>
      )}

      {selectedImage && (
        <div className={`side-panel ${sidePanelOpen ? "" : "side-panel-hidden"}`}>
          <div className="side-panel-content">
            <label className="detail">Details</label>
            <button className="close-button" onClick={closeSidePanel}>✖</button>
            <img src={selectedImage.url} alt="Selected" />
            <input type="text" value={selectedImage.sku} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoModule;
