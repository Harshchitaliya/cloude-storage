import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import "../css/photoeditor.css";

const ImageEditor = ({ imageUrl, onSave, onCancel }) => {
  const [editedImage, setEditedImage] = useState(imageUrl);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sharpness, setSharpness] = useState(0);
  const [tone, setTone] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [flipVertical, setFlipVertical] = useState(false);

  // States for cropping
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const applyFilters = () => {
    return `
      brightness(${Number(brightness)}%) 
      contrast(${Number(contrast)}%) 
      grayscale(${Number(grayscale)}%) 
      saturate(${100 + Number(tone)}%) 
      ${sharpness > 0 ? `contrast(${100 + Number(sharpness)}%)` : ""}
    `;
  };

  const applyTransforms = () => {
    return `
      ${flipHorizontal ? "scaleX(-1)" : ""} 
      ${flipVertical ? "scaleY(-1)" : ""}
    `;
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = () => {
    onSave({
      url: editedImage,
      filters: { brightness, contrast, grayscale, sharpness, tone },
      transforms: { flipHorizontal, flipVertical },
      crop: croppedAreaPixels, // Pass the pixel values for the cropped area
    });
  };

  return (
    <div className="image-editor">
      <div className="crop-container">
        <Cropper
          image={editedImage}
          crop={crop}
          zoom={zoom}
          aspect={4 / 3} // You can adjust the aspect ratio if needed
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
          style={{
            containerStyle: {
              filter: applyFilters(),
              transform: applyTransforms(),
            },
          }}
        />
      </div>
      <div className="editor-controls">
        <div className="slider-container">
          <label>
            Brightness:{" "}
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(e.target.value)}
            />
          </label>
        </div>
        <div className="slider-container">
          <label>
            Contrast:{" "}
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(e.target.value)}
            />
          </label>
        </div>
        <div className="slider-container">
          <label>
            Grayscale:{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={grayscale}
              onChange={(e) => setGrayscale(e.target.value)}
            />
          </label>
        </div>
        <div className="slider-container">
          <label>
            Sharpness:{" "}
            <input
              type="range"
              min="0"
              max="100"
              value={sharpness}
              onChange={(e) => setSharpness(e.target.value)}
            />
          </label>
        </div>
        <div className="slider-container">
          <label>
            Tone:{" "}
            <input
              type="range"
              min="-100"
              max="100"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            />
          </label>
        </div>
        <div className="flip-buttons">
          <button onClick={() => setFlipHorizontal(!flipHorizontal)}>
            Flip Horizontal
          </button>
          <button onClick={() => setFlipVertical(!flipVertical)}>
            Flip Vertical
          </button>
        </div>
        <button onClick={handleSave}>Save</button>
        <button onClick={onCancel} className="cancel">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ImageEditor;
