const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const { getStorage } = require('firebase-admin/storage');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');



const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Firebase Admin SDK (ensure you replace with your credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(), // Replace with your credentials if needed
    storageBucket: 'gs://gem-vi.appspot.com', // Replace with your bucket name
  });
}

const bucket = getStorage().bucket();

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000', // Replace with your frontend URL
  })
);
app.use(express.json()); // To parse JSON bodies

// Route to fetch metadata from Firebase Storage
app.get('/fetch-metadata', async (req, res) => {
  const { url } = req.query;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// Route to fetch an image from Firebase Storage
app.get('/fetch-image', async (req, res) => {
  const { url } = req.query;

  try {
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.set('Content-Type', 'image/png'); // Adjust the content type as necessary
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.post('/remove-background', async (req, res) => {
  const imageUrl = req.body.imageUrl;

  try {

    // Download the image from the given URL
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = imageResponse.data;
  

    // Send the image buffer to the Python background removal service
    const form = new FormData();
    form.append('image', imageBuffer, 'input_image.png');

    const bgRemovalResponse = await axios.post('http://127.0.0.1:5000/remove-background', form, {
      headers: form.getHeaders(),
      responseType: 'arraybuffer', // Expect binary response
    });

    console.log(`Received response from Python service: ${bgRemovalResponse.status}`);

    // Send the background-removed image back to the React frontend
    res.set('Content-Type', 'image/png');
    res.send(bgRemovalResponse.data);
  } catch (error) {
    console.error("Error during background removal:", error.message);
    res.status(500).json({ message: "Failed to remove background", error: error.message });
  }
});




// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
