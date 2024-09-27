import React, { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase"; // Your Firebase config
import "../css/video.css"


const VideoModule = () => {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [message, setMessage] = useState("");

  const auth = getAuth();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        displayUserVideos(user.uid);
      } else {
        setUser(null);
      }
    });
  }, [auth]);

  const displayUserVideos = async (uid) => {
    const userFolderRef = ref(storage, `users/${uid}`);
    const result = await listAll(userFolderRef);

    const allVideos = await Promise.all(
      result.prefixes.map(async (skuFolderRef) => {
        const videosResult = await listAll(skuFolderRef);
        const sku = skuFolderRef.name;

        const videos = await Promise.all(
          videosResult.items.map(async (itemRef) => {
            if (!itemRef.name.endsWith(".json")) {
              const url = await getDownloadURL(itemRef);
              if (itemRef.name.match(/\.(mp4|mov|avi|mkv)$/i)) {
                return { url, sku, fullPath: itemRef.fullPath };
              }
            }
            return null;
          })
        );

        return videos.filter((vid) => vid !== null);
      })
    );

    setVideos(allVideos.flat());
  };

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
      displayUserVideos(user.uid);
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
      {user ? (
        <>
          {message && <p className="message">{message}</p>}
          <div className="video-gallery">
            {videos.map((video, index) => (
              <div key={index} className="video-card" onClick={() => openSidePanel(video)}>
                <video src={video.url} controls width="200" />
                <p>SKU: {video.sku}</p>
                <div className="dropdown">
                  <button className="more-options">
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
