import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import "../css/all.css"; // Import CSS for styling
import { useAuth } from "../contex/theam";

const MediaModule = () => {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const { currentUseruid } = useAuth();

  // Fetch media when the user logs in
  useEffect(() => {
    if (currentUseruid) {
      setLoading(true);
      displayUserMedia(currentUseruid).then(() => setLoading(false));
    }
  }, [currentUseruid]);

  const displayUserMedia = useCallback(async (uid) => {
    try {
      const userFolderRef = ref(storage, `users/${uid}`);
      const result = await listAll(userFolderRef);

      const allMedia = await Promise.all(
        result.prefixes.map(async (skuFolderRef) => {
          const mediaResult = await listAll(skuFolderRef);
          const sku = skuFolderRef.name;

          const media = await Promise.all(
            mediaResult.items.map(async (itemRef) => {
              if (!itemRef.name.endsWith(".json")) {
                const url = await getDownloadURL(itemRef);
                if (itemRef.name.match(/\.(jpeg|jpg|png)$/i)) {
                  return { type: "image", url, sku, fullPath: itemRef.fullPath };
                } else if (itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
                  return { type: "video", url, sku, fullPath: itemRef.fullPath };
                }
              }
              return null;
            })
          );

          return media.filter((item) => item !== null);
        })
      );

      setMedia(allMedia.flat());
    } catch (error) {
      console.error("Error fetching media:", error);
    }
  }, []);

  // Memoize the media list to avoid recalculating
  const memoizedMedia = useMemo(() => {
    return media;
  }, [media]);

  const openMediaPanel = (media) => {
    setSelectedMedia(media);
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
  };

  const downloadMedia = (url, type) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "image" ? "image.jpg" : "video.mp4";
    link.click();
  };

  const deleteMedia = async (media) => {
    const mediaRef = ref(storage, media.fullPath);
    try {
      await deleteObject(mediaRef);
      console.log(`${media.type} deleted successfully.`);
      setSidePanelOpen(false);
      setLoading(true);
      await displayUserMedia(currentUseruid);
      setLoading(false);
    } catch (error) {
      console.error(`Error deleting the ${media.type}:`, error);
    }
  };

  const shareMedia = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this ${selectedMedia.type}`,
          text: `Here is a ${selectedMedia.type} you might like.`,
          url: url,
        });
        console.log(`${selectedMedia.type} shared successfully.`);
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      console.log("Sharing is not supported on this browser.");
    }
  };

  return (
    <div className="media-module">
      {currentUseruid ? (
        <>
          {message && <p className="message">{message}</p>}
          {loading ? (
            <p>Loading media...</p>
          ) : (
            <div className="media-gallery">
              {memoizedMedia.map((item, index) => (
                <div key={index} className="media-card" onClick={() => openMediaPanel(item)}>
                  {item.type === "image" ? (
                    <img src={item.url} alt={`SKU: ${item.sku}`} loading="lazy" />
                  ) : (
                    <video src={item.url} controls width="200" loading="lazy" />
                  )}
                  <p>SKU: {item.sku}</p>
                  <div className="dropdown">
                    <button className="more-options" onClick={(e) => e.stopPropagation()}>
                      <span>⋮</span>
                    </button>
                    <div className="dropdown-menu">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadMedia(item.url, item.type);
                        }}
                      >
                        ⬇ Download
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMedia(item);
                        }}
                      >
                        🗑 Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareMedia(item.url);
                        }}
                      >
                        📤 Share
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <h1>Please log in to view media.</h1>
      )}

      {selectedMedia && (
        <div className={`side-panel ${sidePanelOpen ? "" : "side-panel-hidden"}`}>
          <div className="side-panel-content">
            <label className="detail">Details</label>
            <button className="close-button" onClick={closeSidePanel}>
              ✖
            </button>
            {selectedMedia.type === "image" ? (
              <img src={selectedMedia.url} alt="Selected" />
            ) : (
              <video src={selectedMedia.url} controls width="400" />
            )}
            <input type="text" value={selectedMedia.sku} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaModule;
