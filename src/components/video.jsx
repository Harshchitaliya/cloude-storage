import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
  uploadBytes,
} from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import "../css/video.css"; // Import CSS for styling
import { useAuth } from "../contex/theam";
import LazyLoad from "react-lazyload"; // Lazy load library

const VideoModule = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // For loading state

  const { currentUseruid } = useAuth();

  // Fetch video list from Firebase Storage
  const fetchUserVideos = useCallback(async (uid) => {
    setLoading(true); // Start loading
    try {
      const userFolderRef = ref(storage, `users/${uid}`);
      const result = await listAll(userFolderRef);

      const allVideos = await Promise.all(
        result.prefixes.map(async (skuFolderRef) => {
          const videosResult = await listAll(skuFolderRef);
          const sku = skuFolderRef.name;

          const videos = await Promise.all(
            videosResult.items.map(async (itemRef) => {
              // **Exclude files that start with 'recycle_'**
              if (itemRef.name.startsWith("recycle_")) {
                return null;
              }

              if (
                !itemRef.name.endsWith(".json") &&
                itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)
              ) {
                const url = await getDownloadURL(itemRef);
                return { url, sku, fullPath: itemRef.fullPath };
              }
              return null;
            })
          );

          return videos.filter((vid) => vid !== null);
        })
      );

      setVideos(allVideos.flat());
    } catch (error) {
      console.error("Error fetching videos:", error);
      setMessage("Error fetching videos.");
    } finally {
      setLoading(false); // Stop loading
    }
  }, []);

  useEffect(() => {
    if (currentUseruid) {
      fetchUserVideos(currentUseruid);
    }
  }, [currentUseruid, fetchUserVideos]);

  // Memoize videos list to avoid unnecessary re-computation
  const memoizedVideos = useMemo(() => {
    return videos;
  }, [videos]);

  const openSidePanel = (video) => {
    setSelectedVideo(video);
    setSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setSidePanelOpen(false);
  };

  const downloadVideo = (url) => {
    const link = document.createElement("a");
    link.href = url;
    // Extract the file name from the URL
    const fileName = url.substring(url.lastIndexOf("/") + 1);
    link.download = fileName || "video.mp4";
    link.click();
  };

  const deleteVideo = async (video) => {
    // Confirmation dialog to prevent accidental deletions
    const confirmDelete = window.confirm(
      "Are you sure you want to recycle this video?"
    );
    if (!confirmDelete) return;

    const originalRef = ref(storage, video.fullPath);
    const originalName = originalRef.name;
    const recycledName = `recycle_${originalName}`;
    const recycledRef = ref(storage, `${originalRef.parent.fullPath}/${recycledName}`);

    try {
      // **Fetch the video as a blob**
      const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(video.url)}`)
      const blob = await response.blob();

      // **Upload the blob with the new 'recycle_' prefixed name**
      await uploadBytes(recycledRef, blob);
      console.log(`Recycled video as ${recycledName} successfully.`);

      // **Delete the original video**
      await deleteObject(originalRef);
      console.log("Video recycled successfully.");

      // **Update the state and UI**
      setMessage("Video recycled successfully.");
      setSidePanelOpen(false);
      await fetchUserVideos(currentUseruid);
    } catch (error) {
      console.error("Error recycling the video:", error);
      setMessage("Error recycling the video.");
    }
  };

  const shareVideo = async (url) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check out this video",
          text: "Here is a video you might like.",
          url: url,
        });
        setMessage("Video shared successfully.");
      } catch (error) {
        console.error("Sharing failed:", error);
        setMessage("Sharing failed.");
      }
    } else {
      console.log("Sharing is not supported on this browser.");
      setMessage("Sharing is not supported on this browser.");
    }
  };

  // Memoize video gallery to prevent unnecessary re-renders
  const videoGallery = useMemo(() => {
    return videos.map((video, index) => (
      <LazyLoad key={index} height={200} offset={100} once>
        <div className="video-card" onClick={() => openSidePanel(video)}>
          <video src={video.url} controls width="200" loading="lazy" />
          <p>SKU: {video.sku}</p>
          <div className="dropdown">
            <button
              className="more-options"
              onClick={(e) => e.stopPropagation()} // Stop event propagation here
            >
              <span>⋮</span>
            </button>
            <div className="dropdown-menu">
              <button onClick={() => downloadVideo(video.url)}>⬇ Download</button>
              <button onClick={() => deleteVideo(video)}>🗑 Recycle</button>
              <button onClick={() => shareVideo(video.url)}>📤 Share</button>
            </div>
          </div>
        </div>
      </LazyLoad>
    ));
  }, [videos]);

  return (
    <div className="video-module">
      {currentUseruid ? (
        <>
          {message && <p className="message">{message}</p>}
          {loading ? <p>Loading videos...</p> : null} {/* Show loading state */}
          <div className="video-gallery">
            {videoGallery}
          </div>
        </>
      ) : (
        <h1>Please log in to view videos.</h1>
      )}

      {selectedVideo && (
        <div className={`side-panel ${sidePanelOpen ? "" : "side-panel-hidden"}`}>
          <div className="side-panel-content">
            <label className="detail">Details</label>
            <button className="close-button" onClick={closeSidePanel}>
              ✖
            </button>
            <video src={selectedVideo.url} controls width="400" />
            <input type="text" value={selectedVideo.sku} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoModule;
