const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds')
const catchAsync = require('../utils/catchAsync')
const multer  = require('multer')
//wasn't working until copies and pasted multer, possibly space needed before dest since didn't have before

//node auto looks for index.js
const {storage} = require('../cloudinary');
const upload = multer({ storage })
const Campground = require('../models/campground');

const {isLoggedIn, isAuthor, validateCampground} = require('../middleware')




router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))
    
//this had to be above id route, or else it think "new" is id if below :id route
router.get('/new', isLoggedIn, campgrounds.renderNewForm)


router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'),validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, catchAsync(campgrounds.deleteCampground));
// router.get('/', (req, res) => {
//     res.render('home')
// })









router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm1))


module.exports = router;  