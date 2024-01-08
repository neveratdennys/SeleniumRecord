const express = require('express');
const path = require('path');

const app = express();
const port = 3111; // You can change the port number if needed

// Define the path to your static HTML file
// const indexPath = path.join(__dirname, 'public', 'unitydev.html');
const buttonsPath = path.join(__dirname, 'public', 'buttons2.html');

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// // Define a route to serve the static HTML file
// app.get('/index', (req, res) => {
//   res.sendFile(indexPath);
// });

// // Define a route to serve the static HTML file
// app.get('/buttons', (req, res) => {
//   res.sendFile(buttonsPath);
// });

// Define a route to serve the static HTML file
app.get('/', (req, res) => {
  res.sendFile(buttonsPath);
});



// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
