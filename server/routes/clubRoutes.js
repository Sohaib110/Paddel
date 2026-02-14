const express = require('express');
const router = express.Router();
const { createClub, getClubs } = require('../controllers/clubController');

router.route('/').post(createClub).get(getClubs);

module.exports = router;
