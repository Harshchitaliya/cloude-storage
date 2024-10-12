import React, { useState, useEffect, useCallback, useMemo } from "react";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import "../css/video.css"; // CSS for styling
import { useAuth } from "../contex/theam";

const VideoModule = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // For loading state
  const { currentUseruid } = useAuth();

  // Fetch video list from Firebase Storage
  const fetchUserVideos = useCallback(async (uid) => {
    const userFolderRef = ref(storage, `users/${uid}`);
    const result = await listAll(userFolderRef);

    const allVideos = await Promise.all(
      result.prefixes.map(async (skuFolderRef) => {
        const videosResult = await listAll(skuFolderRef);
        const sku = skuFolderRef.name;

        const videos = await Promise.all(
          videosResult.items.map(async (itemRef) => {
            if (!itemRef.name.endsWith(".json") && itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
              const url = await getDownloadURL(itemRef);
              return { url, sku, fullPath: itemRef.fullPath };
            }
            return null;
          })
        );

        return videos.filter((vid) => vid !== null);
      })
    );

    return allVideos.flat();
  }, []);

  useEffect(() => {
    if (currentUseruid) {
      setLoading(true);
      fetchUserVideos(currentUseruid).then((videos) => {
        setVideos(videos);
        setLoading(false);
      });
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
    link.download = "video.mp4";
    link.click();
  };

  const deleteVideo = async (video) => {
    const videoRef = ref(storage, video.fullPath);
    try {
      await deleteObject(videoRef);
      setMessage("Video deleted successfully.");
      setSidePanelOpen(false);
      setLoading(true);
      fetchUserVideos(currentUseruid).then((videos) => {
        setVideos(videos);
        setLoading(false);
      });
    } catch (error) {
      setMessage("Error deleting the video.");
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
        setMessage("Sharing failed.");
      }
    } else {
      setMessage("Sharing is not supported on this browser.");
    }
  };

  return (
    <div className="video-module">
      {currentUseruid ? (
        <>
          {message && <p className="message">{message}</p>}
          {loading ? <p>Loading videos...</p> : null} {/* Show loading state */}
          <div className="video-gallery">
            {memoizedVideos.map((video, index) => (
              <div key={index} className="video-card" onClick={() => openSidePanel(video)}>
                <video src={video.url} controls width="200" loading="lazy" /> {/* Lazy load videos */}
                <p>SKU: {video.sku}</p>
                <div className="dropdown">
                  <button className="more-options" onClick={(e) => e.stopPropagation()}>
                    <span>⋮</span>
                  </button>
                  <div className="dropdown-menu">
                    <button onClick={() => downloadVideo(video.url)}>⬇ Download</button>
                    <button onClick={() => deleteVideo(video)}>🗑 Delete</button>
                    <button onClick={() => shareVideo(video.url)}>📤 Share</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <h1>Please log in to view videos.</h1>
      )}

      {selectedVideo && (
        <div className={`side-panel ${sidePanelOpen ? "" : "side-panel-hidden"}`}>
          <div className="side-panel-content">
            <label className="detail">Details</label>
            <button className="close-button" onClick={closeSidePanel}>✖</button>
            <video src={selectedVideo.url} controls width="400" />
            <input type="text" value={selectedVideo.sku} readOnly />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoModule;
