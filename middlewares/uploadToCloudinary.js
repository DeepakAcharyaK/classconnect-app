const cloudinary = require('../middlewares/cloudinaryConfig.js');

// Middleware to handle uploading to Cloudinary
const uploadToCloudinary = async (req, res, next) => {
  try {
    if (!req.file) {
      // No new file uploaded, keep the existing image and proceed to the next middleware
      return next();
    }

    const fileBase64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: 'classConnect/teacher/profile_images', // Store in folder named 'profile_images'
      public_id: `teacher_${req.params.teacherid}`, // Unique ID based on teacher ID
      overwrite: true, // Overwrite existing image
    });

    // Save Cloudinary URL in request object for further processing
    req.file.cloudinaryUrl = result;
    next();
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).send('Error uploading image');
  }
};

module.exports = uploadToCloudinary;
