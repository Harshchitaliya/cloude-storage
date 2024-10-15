import React, { useState, useEffect, useCallback } from "react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import { useAuth } from "../contex/theam";
import "../css/delete.css"; // Import CSS for styling

const DeleteItem = () => {
  const [recycledMedia, setRecycledMedia] = useState([]);
  const [loading, setLoading] = useState(false); // Overall loading state
  const [restoring, setRestoring] = useState(false); // State for individual restore operation
  const { currentUseruid } = useAuth();
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);


  useEffect(() => {
    if (currentUseruid) {
      setLoading(true);
      displayRecycledMedia(currentUseruid).then(() => setLoading(false));
    }
  }, [currentUseruid]);

  const displayRecycledMedia = useCallback(async (uid) => {
    try {
      const userFolderRef = ref(storage, `users/${uid}`);
      const result = await listAll(userFolderRef);

      const allMedia = await Promise.all(
        result.prefixes.map(async (skuFolderRef) => {
          const mediaResult = await listAll(skuFolderRef);
          const sku = skuFolderRef.name;

          const media = await Promise.all(
            mediaResult.items.map(async (itemRef) => {
              // **Only include files that start with 'recycle_'**
              if (itemRef.name.startsWith("recycle_")) {
                const url = await getDownloadURL(itemRef);
                if (itemRef.name.match(/\.(jpeg|jpg|png)$/i)) {
                  return {
                    type: "image",
                    url,
                    sku,
                    fullPath: itemRef.fullPath,
                    originalName: itemRef.name.replace(/^recycle_/, ""), // Remove 'recycle_' prefix
                  };
                } else if (itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
                  return {
                    type: "video",
                    url,
                    sku,
                    fullPath: itemRef.fullPath,
                    originalName: itemRef.name.replace(/^recycle_/, ""),
                  };
                }
              }
              return null;
            })
          );

          return media.filter((item) => item !== null);
        })
      );

      setRecycledMedia(allMedia.flat());
    } catch (error) {
      console.error("Error fetching recycled media:", error);
    }
  }, []);

  const restoreMedia = async (media) => {
    setRestoring(true); // Start restore loading state
    const recycledRef = ref(storage, media.fullPath);
    const originalRef = ref(
      storage,
      `${recycledRef.parent.fullPath}/${media.originalName}`
    );

    try {
      // Get the file's blob
      const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(media.url)}`)
      const blob = await response.blob();

      // Upload the file without 'recycle_' in its name
      await uploadBytes(originalRef, blob);
      console.log(`${media.type} restored successfully.`);

      // Delete the recycled file
      await deleteObject(recycledRef);
      console.log(`Recycled ${media.type} deleted successfully.`);

      // Show success alert
      alert(`${media.type} restored successfully!`);

      // Refresh the recycled media list
      await displayRecycledMedia(currentUseruid);
    } catch (error) {
      console.error(`Error restoring the ${media.type}:`, error);
    } finally {
      setRestoring(false); // Stop restore loading state
    }
  };

  const deleteMedia = async (media) => {
    const recycledRef = ref(storage, media.fullPath);

    try {
      // Delete the recycled file permanently
      await deleteObject(recycledRef);
      console.log(`${media.type} deleted permanently.`);

      // Refresh the recycled media list
      setLoading(true);
      await displayRecycledMedia(currentUseruid);
      setLoading(false);
    } catch (error) {
      console.error(`Error deleting the ${media.type}:`, error);
    }
  };


  const handleSelectItem = (e, item) => {
    e.stopPropagation();
    const updatedSelection = new Set(selectedItems);
    if (e.target.checked) {
      updatedSelection.add(item);
    } else {
      updatedSelection.delete(item);
    }
    setSelectedItems(updatedSelection);
    setSelectAll(updatedSelection.size === recycledMedia.length);
  };

  // Select/Unselect all items
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedItems(new Set(recycledMedia));
    } else {
      setSelectedItems(new Set());
    }
    setSelectAll(e.target.checked);
  };


  const restoreSelectedMedia = async () => {
    setRestoring(true);
    try {
      await Promise.all(Array.from(selectedItems).map(restoreMedia));
      alert("Selected items restored successfully!");
      setSelectedItems(new Set());
      setSelectAll(false);
      await displayRecycledMedia(currentUseruid);
    } catch (error) {
      console.error("Error restoring selected items:", error);
      alert("An error occurred while restoring selected items.");
    } finally {
      setRestoring(false);
    }
  };

  // Batch delete
  const deleteSelectedMedia = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to permanently delete the selected items?"
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await Promise.all(Array.from(selectedItems).map(deleteMedia));
      alert("Selected items deleted permanently!");
      setSelectedItems(new Set());
      setSelectAll(false);
      await displayRecycledMedia(currentUseruid);
    } catch (error) {
      console.error("Error deleting selected items:", error);
      alert("An error occurred while deleting selected items.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="recycle-module">
      {currentUseruid ? (
        <>
          {loading ? (
            <p>Loading recycled media...</p>
          ) : recycledMedia.length === 0 ? (
            <p>No recycled media found.</p>
          ) : (
            <>
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
                      {selectAll ? "All items selected" : `${selectedItems.size} selected`}
                    </span>
                    <button className="unselect-button" onClick={() => setSelectedItems(new Set())}>
                      Unselect
                    </button>
                  </div>
                  <div className="toolbar-buttons">
                    <button onClick={restoreSelectedMedia} className="restore-button">
                      {restoring ? <div className="spinner"></div> : "♻ Restore Selected"}
                    </button>
                    <button onClick={deleteSelectedMedia} className="delete-button">
                      🗑 Delete Selected
                    </button>
                  </div>
                </div>
              )}
              <div className="media-gallery">
                {recycledMedia.map((item, index) => (
                  <div key={index} className="media-card">
                    <div className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item)}
                        onChange={(e) => handleSelectItem(e, item)}
                        className="styled-checkbox"
                      />
                    </div>
                    {item.type === "image" ? (
                      <img
                        src={item.url}
                        alt={`SKU: ${item.sku}`}
                        loading="lazy"
                      />
                    ) : (
                      <video src={item.url} controls width="200" loading="lazy" />
                    )}
                    <p>SKU: {item.sku}</p>
                    <div className="dropdown">
                      <button className="more-options">
                        <span>⋮</span>
                      </button>
                      <div className="dropdown-menu">
                        <button onClick={() => restoreMedia(item)}>
                          {restoring ? (
                            <div className="spinner"></div>
                          ) : (
                            <span>♻ Restore</span>
                          )}
                        </button>
                        <button onClick={() => deleteMedia(item)}>
                          🗑 Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      ) : (
        <h1>Please log in to view recycled media.</h1>
      )}
    </div>
  );
};

export default DeleteItem;



