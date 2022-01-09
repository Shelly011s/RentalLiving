require('dotenv').config()
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    House = require("./models/house"),
    Comment     = require("./models/comment"),
    User        = require("./models/user")
    //seedDB      = require("./seeds")
    
/*requiring routes*/
var commentRoutes    = require("./routes/comments"),
    houseRoutes = require("./routes/houses"),
    indexRoutes      = require("./routes/index")
    
    

//mongoose.connect("mongodb://localhost:27017/rentalliving",
mongoose.connect(process.env.MONGO_URL,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    }).then(()=>console.log("Connection established"));

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');
//seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "User auth",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){

   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/houses", houseRoutes);
app.use("/houses/:id/comments", commentRoutes);


app.listen(process.env.PORT || 3000, () => {
    console.log('Server is up and running');
  });
