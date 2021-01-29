if(process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}




const express = require('express');
const path = require('path')
const mongoose = require('mongoose');
//npm i ejs-mate, create boiler plate
const ejsMate = require('ejs-mate');
//npm i express-session
const session =  require('express-session')
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError')
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local')
const User = require('./models/user')
const helmet = require("helmet")

const mongoSanitize = require('express-mongo-sanitize');

const userRoutes = require('./routes/users')
const campgroundsRoutes = require('./routes/campgrounds');
const reviewsRoutes = require('./routes/reviews');
const { MongoStore } = require('connect-mongo');
const MongoDBStore = require("connect-mongo")(session)
const dbUrl = process.env.DB_URL|| 'mongodb://localhost:27017/yelp-camp';


// const { join } = require('path');
// 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})

const db = mongoose.connection;
db.on("error", console.error.bind(console," connection error:"));
db.once("open", () => {
    console.log("Database connected")
});


const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

//many engines are used to parse ejs, set ejsmate as default like so
app.engine('ejs', ejsMate)
app.use(express.urlencoded({ extended: true}))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')))
app.use(mongoSanitize({
    replaceWith: '_'
}))
// express.static, serves static assets 
// server side validation middleware, require in parameters of routes

//connect-mongo variable needs to be the same here
const secret = process.env.SECRET || "Thisshouldbeabettersecret";
const store = new MongoDBStore({
    url: dbUrl,
    secret,
    //lazy update, check docs, unecessary resaves, refresh unless change in session data
    //this is in seconds not miliseconds
    touchAfter: 24 * 60 * 60
})

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})


const sessionConfig = {
    store,
    name: "session",
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        // Date.now in milisecond, 1000m in 1s, 60s in 1min, 60mim 1h, etc
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
    
}
app.use(session(sessionConfig))
app.use(flash());
// app.use(helmet());
app.use(helmet());


const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/js/bootstrap.bundle.min.js"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta1/dist/css/bootstrap.min.css"
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dnxku1fje/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);


app.use(passport.initialize())
app.use(passport.session())
passport.use(new LocalStrategy(User.authenticate()))

passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {
    // when you flash and redirect in routes
    //message will be in 'success'
    // will have access to it in
    // res.locals.success
    console.log(req.query);
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
    // always call next for middleware, stop forgetting
})

app.get('/fakeUser', async (req, res) => {
    const user = new User({email: 'aditya@gmail.com', username: 'aditya'})
    const newUser = await User.register(user, 'chicken')
    res.send(newUser)
})

app.use('/', userRoutes)
app.use("/campgrounds", campgroundsRoutes)
app.use("/campgrounds/:id/reviews", reviewsRoutes)

app.get('/', (req, res) => {
    res.render('home')
})



app.all('*', (req, res, next) =>{
    next(new ExpressError('Page Not Found', 404))
})

// catchAsync next is passed into this
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if(!err.message) err.message = 'Oh No, Something Went Wrong!'
    res.status(statusCode).render('error', {err})
    
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Serving on port ${port}`)
}
)