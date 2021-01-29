const Campground = require('../models/campground');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding')
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding ({accessToken: mapBoxToken})
const {cloudinary } = require("../cloudinary");




module.exports.index = async(req, res) => {
    const campgrounds = await Campground.find({})
    res.render('campgrounds/index', {campgrounds})
 }

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new');}

module.exports.createCampground = async(req, res, next) => {
    //check docs
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    
    
    //you need to parse the body from forms
    
    //app.use(express.urlencoded({ extended: true}))
    // if(!req.body.campground) throw new ExpressError('Invalid Campground Data', 400)
    // npm i joi
   
    
    const campground = new Campground(req.body.campground);
    //geoData.features is an array, you can see when you console.log geoData
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(f => ({url: f.path, filename: f.filename}))
    //associate current logged in user
    //in the schema there is a author for campground that takes id
    campground.author = req.user._id;
    await campground.save();
    console.log(campground)
    req.flash('success', 'successfully made a new campground');
    res.redirect(`/campgrounds/${campground._id}`)
 
}

module.exports.showCampground = async (req, res) => {
    // .populate to change ObID in reviews to data
    //populate this one author on the campground
    //populate the reviews on this campground
    //populate the authors of the reviews using nested populate
    const campground = await Campground.findById(req.params.id).populate({
        path:'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');
    
    if(!campground) {
        req.flash('error', 'Cannot find that campground!');
       return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show', { campground })
}

module.exports.renderEditForm1 = async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id)
    if(!campground) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }

    res.render('campgrounds/edit', { campground })

}

module.exports.updateCampground = async (req, res) => {
    const { id } = req.params;
    
    
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground})
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    //take data from array and push that, can only take array of objects not array of arrays, mongo validations
    campground.images.push(...imgs)
    await campground.save();
    if(req.body.deleteImages){
        //you have to delete images on the hosting site 
        for(let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        // pull from the images array where the filename is in the req.body.deleteImages
    await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
     
    }
    req.flash('success', 'Successfully updated campgrounds');
    res.redirect(`/campgrounds/${campground._id}`)
    }

module.exports.deleteCampground = async (req, res) => {

    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Sucessfully deleted campground')
    res.redirect('/campgrounds');
}