
const {campgroundSchema, reviewSchema} = require('./schemas.js')
//validateCampground uses joi schema 
const ExpressError = require('./utils/ExpressError');
const Campground = require('./models/campground');
const Review = require('./models/review');


//from users.js, passport.authenticate
module.exports.isLoggedIn = (req, res, next) => {
    
    if(!req.isAuthenticated()){
        req.session.returnTo = req.originalUrl
        req.flash('error', 'you must be signed in frist!')
        return res.redirect('/login');
    }
    next();
}


module.exports.validateCampground = (req, res, next) => {
    
    const {error} = campgroundSchema.validate(req.body);
    if (error) {
            const msg = error.details.map(el => el.message).join(',')
            throw new ExpressError(msg, 400)
        
    } else {
        // you need to pass next for middle ware
        next()
    }
    
}


module.exports.isAuthor = async(req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    //check if user is allowed to edit with the equals()
    if(req.user && !campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that')
        
        return res.redirect(`/campgrounds/${id}`);
       }
      next();
}
//campgrounds/id/reviews/reviewId
module.exports.isReviewAuthor = async(req, res, next) => {
    const {id, reviewId} = req.params;
    
    

    const review = await Review.findById(reviewId);
    
    //check if user is allowed to edit with the equals()
    if(!review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that')
        
        return res.redirect(`/campgrounds/${id}`);
       }
      next();
}


module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    
} else {
    // you need to pass next for middle ware
    next()
}
}