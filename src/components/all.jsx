import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, listAll, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import "../css/all.css"; // Import CSS for styling
import { useAuth } from "../contex/theam";

const MediaModule = () => {
  const [media, setMedia] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { currentUseruid } = useAuth();

  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

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
              if (itemRef.name.startsWith("recycle") || itemRef.name.endsWith(".json")) {
                return null;
              }
              const url = await getDownloadURL(itemRef);
              return {
                type: itemRef.name.match(/\.(jpeg|jpg|png)$/i)
                  ? "image"
                  : "video",
                url,
                sku,
                fullPath: itemRef.fullPath,
              };
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

  const openMediaPanel = useCallback((media) => {
    setSelectedMedia(media);
    setSidePanelOpen(true);
  }, []);

  const closeSidePanel = useCallback(() => {
    setSidePanelOpen(false);
  }, []);

  const downloadMedia = useCallback((url, type) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = type === "image" ? "image.jpg" : "video.mp4";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const deleteMedia = useCallback(async (media) => {
    const originalRef = ref(storage, media.fullPath);
    const originalName = originalRef.name;
    const recycledName = `recycle_${originalName}`;
    const recycledRef = ref(storage, `${originalRef.parent.fullPath}/${recycledName}`);

    try {
      const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(media.url)}`);
      const blob = await response.blob();
      await uploadBytes(recycledRef, blob);
      await deleteObject(originalRef);

      setSidePanelOpen(false);
      setLoading(true);
      await displayUserMedia(currentUseruid);
      setLoading(false);
    } catch (error) {
      console.error(`Error recycling the ${media.type}:`, error);
    }
  }, [displayUserMedia, currentUseruid]);

  const shareMedia = useCallback(async (mediaItems) => {
    if (navigator.share) {
      try {
        for (const media of mediaItems) {
          await navigator.share({
            title: `Check out this ${media.type}`,
            text: `Here is a ${media.type} you might like.`,
            url: media.url,
          });
        }
        console.log(`${mediaItems.length} ${mediaItems.length > 1 ? 'items were' : 'item was'} shared successfully.`);
      } catch (error) {
        console.error("Sharing failed:", error);
      }
    } else {
      try {
        const urls = Array.from(mediaItems).map((media) => media.url).join('\n');
        await navigator.clipboard.writeText(urls);
        alert('Media URLs copied to clipboard. You can share them manually.');
      } catch (error) {
        console.error("Clipboard copy failed:", error);
        alert('Unable to share media.');
      }
    }
  }, []);

  const handleSelectItem = (e, item) => {
    const updatedSelection = new Set(selectedItems);
    if (e.target.checked) {
      updatedSelection.add(item);
    } else {
      updatedSelection.delete(item);
    }
    setSelectedItems(updatedSelection);
    setSelectAll(updatedSelection.size === media.length);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(media));
    } else {
      setSelectedItems(new Set());
    }
    setSelectAll(e.target.checked);
  };

  const downloadSelected = (items) => {
    items.forEach((item) => downloadMedia(item.url, item.type));
  };

  const deleteSelected = async (items) => {
    setLoading(true);
    try {
      await Promise.all(Array.from(items).map((item) => deleteMedia(item)));
      setSelectedItems(new Set());
      setSelectAll(false);
      console.log(`${items.length} ${items.length > 1 ? 'items were' : 'item was'} recycled successfully.`);
    } catch (error) {
      console.error("Error deleting selected items:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="media-module">
      {currentUseruid ? (
        <>
          {message && <p className="message">{message}</p>}

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
                  {selectAll ? "All media selected" : `${selectedItems.size} selected`}
                </span>
              </div>

              <div className="toolbar-buttons">
                <button className="unselect-button" onClick={() => setSelectedItems(new Set())}>
                  Unselect
                </button>

                <button onClick={() => downloadSelected(selectedItems)} className="download-button">
                  ⬇ Download
                </button>

                <button onClick={() => deleteSelected(selectedItems)} className="delete-button">
                  🗑 Delete
                </button>

                <button onClick={() => shareMedia(selectedItems)} className="share-button">
                  📤 Share
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <p>Loading media...</p>
          ) : (
            <div className="media-gallery">
              {media.map((item, index) => (
                <div key={index} className="media-card">
                  <div className="checkbox-wrapper">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item)}
                      onChange={(e) => handleSelectItem(e, item)}
                      onClick={(e) => e.stopPropagation()}
                      className="styled-checkbox"
                    />
                  </div>
                  <div onClick={() => openMediaPanel(item)}>
                    {item.type === "image" ? (
                      <img src={item.url} alt={`SKU: ${item.sku}`} loading="lazy" />
                    ) : (
                      <video src={item.url} controls width="200" loading="lazy" />
                    )}
                    <p>Sku: {item.sku}</p>
                  </div>
                  <div className="dropdown">
                    <button
                      className="more-options"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>⋮</span>
                    </button>
                    <div className="dropdown-menu">
                      <button onClick={() => downloadMedia(item.url, item.type)}>⬇ Download</button>
                      <button onClick={() => deleteMedia(item)}>🗑 Recycle</button>
                      <button onClick={() => shareMedia(new Set([item]))}>📤 Share</button>
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
