const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // You may need to install node-fetch if using older Node.js versions

const app = express();
const PORT = process.env.PORT || 5001;  // Changed to 5001

app.use(cors({
    origin: 'http://localhost:3000',  // Replace with your frontend URL
}));

app.get('/fetch-metadata', async (req, res) => {
  const { url } = req.query;

  try {
    // Fetch the data from the Firebase Storage URL
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  }
});

// New route to fetch image
app.get('/fetch-image', async (req, res) => {
  const { url } = req.query;

  try {
    // Fetch the image from the Firebase Storage URL
    const response = await fetch(url);
    const buffer = await response.buffer();
    res.set('Content-Type', 'image/png'); // Adjust content type if necessary
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ error: 'Failed to fetch image' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
