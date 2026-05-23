const express = require('express');
const router = express.Router();
const { register, login, googleSignIn } = require('../controllers/auth.controller');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleSignIn);

module.exports = router;
