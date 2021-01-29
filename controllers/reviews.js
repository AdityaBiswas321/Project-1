const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const campground = await Campground.findById(req.params.id)
    const review = new Review(req.body.review)
    //associate current logged in user
    //in the schema there is a author for review that takes id 
    review.author = req.user._id;
    // get the id specific reviews into
    // specific campground  with .push()
    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', "Created new review!")
    res.redirect(`/campgrounds/${campground._id}`);
}

module.exports.deleteReview = async (req, res) => {
    const {id, reviewId} = req.params;
    //only :ids in req parameters 
    await Campground.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!')
    res.redirect(`/campgrounds/${id}`)
}