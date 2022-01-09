var express = require("express");
var router  = express.Router();
var House = require("../models/house");
var middleware = require("../middleware");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'shelly101', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


//INDEX - show all houses
router.get("/", function(req, res){
    
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all houses from DB
        House.find( {$or:[{name: regex},{location: regex}]}, function(err, allHouses){
            if(err || !allHouses.length){
                req.flash('error', 'No matches found. Please try again.');
                res.redirect("back");
           } else {
              res.render("houses/index",{houses: allHouses, page: 'houses'});
           }
        });
    } else {
        // Get all houses from DB
        House.find({}, function(err, allHouses){
           if(err){
               console.log(err);
           } else {
              res.render("houses/index",{houses:allHouses});
           }
        });
    }
    
});

//CREATE - add new house to DB
/*
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to houses array
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var location = req.body.location;
    var desc = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    }
    var newHouse = {name: name, image: image,price: price, description: desc, author:author,location:location}
    
    // Create a new house and save to DB
    House.create(newHouse, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to houses page
            console.log(newlyCreated);
            res.redirect("/houses");
        }
    });
});*/

router.post("/", middleware.isLoggedIn, upload.array("image[]",3), async function(req, res) {

    // add author to house
    req.body.house.author = {
        id: req.user._id,
        username: req.user.username
    };

    req.body.house.image = [];
    req.body.house.imageId = [];
    for (const file of req.files) {
        let result = await cloudinary.uploader.upload(file.path);
        req.body.house.image.push(result.public_id);
        req.body.house.imageId.push(result.secure_url);
    }

    House.create(req.body.house, function(err, house) {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('back');
        }
        res.redirect('/houses/' + house.id);
    });
    
        
      // add cloudinary url for the image to the house object under image property
      // add image's public_id to house object
      //req.body.house.imageId = result.public_id;
      //req.body.house.image = result.secure_url;
      // add author to house
      //req.body.house.author = {
      //  id: req.user._id,
      //  username: req.user.username
      //}
      
    
});

//NEW - show form to create new house
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("houses/new"); 
});

// SHOW - shows more info about one house
router.get("/:id", function(req, res){
    //find the house with provided ID
    House.findById(req.params.id).populate("comments").exec(function(err, foundHouse){
        if(err || !foundHouse){
            req.flash("error", "House not found");
            res.redirect("back");
        } else {
            //render show template with that house
            
            res.render("houses/show", {house: foundHouse });
        }
    });
});

// EDIT house ROUTE
router.get("/:id/edit", middleware.checkHouseOwnership, function(req, res){
    House.findById(req.params.id, function(err, foundHouse){
        res.render("houses/edit", {house: foundHouse});
    });
});

// UPDATE house ROUTE
router.put("/:id",middleware.checkHouseOwnership, upload.array("image[]",3),function(req, res){
    // find and update the correct house
    House.findByIdAndUpdate(req.params.id, req.body.house, async function(err, updatedhouse){
       if(err){
           res.redirect("/houses");
       } else {
        
           if (req.files) {
              try {                                    
                   updatedhouse.image = [];
                   updatedhouse.imageId = [];              

                  for (const file of req.files) {
                    var result = await cloudinary.v2.uploader.upload(file.path,{overwrite:true,invalidate:true });
                    updatedhouse.image.push(result.secure_url);
                    updatedhouse.imageId.push(result.public_id);
                  }
                  
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
           //redirect somewhere(show page)
           updatedhouse.save();
           req.flash("success", "Edits added successfully.");
           res.redirect("/houses/" + req.params.id);
       }
    });
});
/*router.put("/:id", upload.single('image'), function(req, res){
    House.findById(req.params.id, async function(err, house){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            if (req.file) {
              try {
                  await cloudinary.v2.uploader.destroy(house.imageId);
                  var result = await cloudinary.v2.uploader.upload(req.file.path);
                  house.imageId = result.public_id;
                  house.image = result.secure_url;
              } catch(err) {
                  req.flash("error", err.message);
                  return res.redirect("back");
              }
            }
            house.name = req.body.house.name;
            house.description = req.body.house.description;
            house.price = req.body.house.price;
            house.location = req.body.house.location;
            house.save();
            req.flash("success","Successfully Updated!");
            res.redirect("/houses/" + house._id);
        }
    });
});*/

// DESTROY house ROUTE
router.delete("/:id",middleware.checkHouseOwnership, function(req, res){
    House.findByIdAndDelete(req.params.id, async function(err, house){

        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        else {
            try {
                //delete the original image fr0m cl
                await cloudinary.v2.uploader.destroy(house.imageId);
                house.remove();
                req.flash('success', 'deleted successfully!');
                res.redirect('/houses');
            } catch (error) {
            }
            req.flash('success', 'Deleted Successfully')
            res.redirect('/houses')
        }
    });
   /*House.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/houses");
      } else {
          res.redirect("/houses");
      }
   });*/
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;

