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
  const [loading, setLoading] = useState(false); // For showing loading state
  const { currentUseruid } = useAuth();

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
              // **Exclude files that start with 'recycle_'**
              if (itemRef.name.startsWith("recycle_")) {
                return null;
              }

              if (
                !itemRef.name.endsWith(".json") &&
                itemRef.name.match(/\.(jpeg|jpg|png|webp)$/i)
              ) {
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
    // Extract the file name from the URL
    const fileName = url.substring(url.lastIndexOf('/') + 1);
    link.download = fileName || "image.jpg";
    link.click();
  };

  const deleteImage = async (image) => {
    const originalRef = ref(storage, image.fullPath);
    const originalName = originalRef.name;
    const recycledName = `recycle_${originalName}`;
    const recycledRef = ref(storage, `${originalRef.parent.fullPath}/${recycledName}`);

    try {
      // **Fetch the image as a blob**
      const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(image.url)}`)
      const blob = await response.blob();

      // **Upload the blob with the new 'recycle_' prefixed name**
      await uploadBytes(recycledRef, blob);
      console.log(`Recycled image as ${recycledName} successfully.`);

      // **Delete the original image**
      await deleteObject(originalRef);
      console.log("Image recycled successfully.");

      // **Update the state and UI**
      setSidePanelOpen(false);
      await displayUserImages(currentUseruid);
    } catch (error) {
      console.error("Error recycling the image:", error);
    }
  };

  const shareImage = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this image",
          text: "Here is an image you might like.",
          url: url,
        });
        console.log("Image shared successfully.");
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      console.log("Sharing is not supported on this browser.");
    }
  };

  // Memoize image gallery to prevent unnecessary re-renders
  const imageGallery = useMemo(() => {
    return images.map((image, index) => (
      <LazyLoad key={index} height={200} offset={100} once>
        <div className="image-card" onClick={() => openImagePanel(image)}>
          <img src={image.url} alt={`SKU: ${image.sku}`} loading="lazy" />
          <p>SKU: {image.sku}</p>
          <div className="dropdown">
            <button
              className="more-options"
              onClick={(e) => e.stopPropagation()} // Stop event propagation here
            >
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
  }, [images]);

  return (
    <div className="photo-module">
      {currentUseruid ? (
        <>
          {loading && <p>Loading images...</p>}
          <div className="image-gallery">
            {imageGallery}
          </div>
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
