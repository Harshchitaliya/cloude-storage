import React, { useState } from 'react';
import Photo from './photo';  // Component to display photos
import Video from './video';  // Component to display videos

const Gallary = () => {
  const [activeTab, setActiveTab] = useState('all'); // Active tab state

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="container">
      <h1>Gallery</h1>
      <nav>
        <div className="nav nav-tabs">
          <button
            className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => handleTabClick('all')}
          >
            All
          </button>
          <button
            className={`nav-link ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => handleTabClick('image')}
          >
            Image
          </button>
          <button
            className={`nav-link ${activeTab === 'video' ? 'active' : ''}`}
            onClick={() => handleTabClick('video')}
          >
            Video
          </button>
        </div>
      </nav>

      <div className="tab-content mt-4">
        {activeTab === 'all' && (
          <>
            <Photo />
            <Video />
          </>
        )}
        {activeTab === 'image' && <Photo />}
        {activeTab === 'video' && <Video />}
      </div>
    </div>
  );
};

export default Gallary;
