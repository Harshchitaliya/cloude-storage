import React, { useState, useCallback, useRef } from "react";
import Cropper from "react-easy-crop";
import "../css/photoeditor.css";

const ImageEditor = ({ imageUrl, onSave, onCancel, fetchImageFromUrl }) => {
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

  const canvasRef = useRef(null);

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

  const getImageDataUri = async (url) => {
    const response = await fetch(`http://localhost:5001/fetch-image?url=${encodeURIComponent(url)}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };
  

  const getCroppedImage = async () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
  
  
    
    
    const image = new Image();
image.crossOrigin = "Anonymous"; // Set this for extra CORS safety

// Convert the fetched image to a data URI
const dataUri = await getImageDataUri(imageUrl);
image.src = dataUri;

  
    return new Promise((resolve) => {
      image.onload = () => {
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
  
        context.filter = applyFilters();
        context.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
  
        // Convert canvas to Blob directly
        canvas.toBlob((blob) => {
          resolve(blob);
        }, "image/png");
      };
    });
  };
  
  const handleSave = async () => {
    const editedBlob = await getCroppedImage();
    onSave({
      blob: editedBlob, // Directly passing the Blob
      filters: { brightness, contrast, grayscale, sharpness, tone },
      transforms: { flipHorizontal, flipVertical },
      crop: croppedAreaPixels,
    });
  };
  

  return (
    <div className="image-editor">
      <div className="crop-container">
        <Cropper
          image={imageUrl} // The URL passed to the component
          crop={crop}
          zoom={zoom}
          aspect={4 / 3}
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
        <canvas ref={canvasRef} style={{ display: "none" }} />
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
