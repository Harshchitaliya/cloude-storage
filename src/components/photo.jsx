import React, { useState, useEffect } from "react";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import '../css/photo.css'; // Import CSS for styling
import { useAuth } from "../contex/theam";

const PhotoModule = () => {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [message, setMessage] = useState("");
  const [sidePanelOpen, setSidePanelOpen] = useState(false);

  const { currentUseruid } = useAuth();

  useEffect(() => {
    if (currentUseruid) {
      displayUserImages(currentUseruid);
    }
  }, [currentUseruid]);

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
              if (itemRef.name.match(/\.(jpeg|jpg|png)$/i)) {
                return { url, sku, fullPath: itemRef.fullPath };
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
    link.download = "image.jpg";
    link.click();
  };

  const deleteImage = async (image) => {
    const imageRef = ref(storage, image.fullPath);
    try {
      await deleteObject(imageRef);
      console.log("Image deleted successfully.");
      setSidePanelOpen(false);
      displayUserImages(currentUseruid);
    } catch (error) {
      console.log("Error deleting the image.");
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
        console.log("Sharing failed.");
      }
    } else {
      console.log("Sharing is not supported on this browser.");
    }
  };

  return (
    <div className="photo-module">
      {currentUseruid ? (
        <>
          {message && <p className="message">{message}</p>}
          <div className="image-gallery">
            {images.map((image, index) => (
              <div key={index} className="image-card" onClick={() => openImagePanel(image)}>
                <img src={image.url} alt={`SKU: ${image.sku}`} />
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
                    <button onClick={() => deleteImage(image)}>🗑 Delete</button>
                    <button onClick={() => shareImage(image.url)}>📤 Share</button>
                  </div>
                </div>
              </div>
            ))}
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
