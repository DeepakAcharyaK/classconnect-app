const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set up storage configuration for Multer to store files locally in the "public/uploads" folder
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/uploads')); // Directory where files will be saved
  },
  filename: function (req, file, cb) {
    const uuid = uuidv4();
    const ext = path.extname(file.originalname);

    cb(null, uuid+ext);
  }
});

// Initialize Multer with the defined storage configuration
const upload = multer({
  storage: storage
});

module.exports = upload;

