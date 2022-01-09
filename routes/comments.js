var express = require("express");
var router  = express.Router({mergeParams: true});
var House = require("../models/house");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Comments New
router.get("/new",middleware.isLoggedIn, function(req, res){
    // find house by id
    console.log(req.params.id);
    House.findById(req.params.id, function(err, house){
        if(err){
            console.log(err);
        } else {
             res.render("comments/new", {house: house});
        }
    })
});

//Comments Create
router.post("/",middleware.isLoggedIn,function(req, res){
   //lookup house using ID
   House.findById(req.params.id, function(err, house){
       if(err){
           console.log(err);
           res.redirect("/houses");
       } else {
        Comment.create(req.body.comment, function(err, comment){
           if(err){
               req.flash("error", "Something went wrong");
               console.log(err);
           } else {
               //add username and id to comment
               comment.author.id = req.user._id;
               comment.author.username = req.user.username;
               //save comment
               comment.save();
               house.comments.push(comment._id);
               house.save();
               //console.log(comment);
               req.flash("success", "Successfully added comment");
               res.redirect('/houses/' + house._id);
           }
        });
       }
   });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
    House.findById(req.params.id, function(err, foundHouse) {
        if(err || !foundHouse) {
            req.flash("error", "No house found");
            return res.redirect("back");
        }
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                req.flash("error", "Edits failed");
                res.redirect("back");
            } else {
                req.flash("success", "Edits added successfully.");
                res.render("comments/edit", {house_id: req.params.id, comment: foundComment});
            }
        });
    });
});

// COMMENT UPDATE
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          res.redirect("back");
      } else {
          res.redirect("/houses/" + req.params.id );
      }
   });
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comment deleted");
           res.redirect("/houses/" + req.params.id);
       }
    });
});

module.exports = router;