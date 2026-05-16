const express = require('express');
const router = express.Router();
const { upload, uploadImage, deleteImage } = require('../controllers/upload.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/image', protect, upload.single('image'), uploadImage);
router.delete('/image', protect, deleteImage);

module.exports = router;
