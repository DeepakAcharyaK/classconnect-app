const multer = require('multer');

// Setup storage for Multer (optional, using memory storage in this example)
const storage = multer.memoryStorage(); 

// Configure Multer for single file upload named 'profileImage'
const upload = multer({ storage });

module.exports = upload ;
