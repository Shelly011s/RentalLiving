var mongoose = require("mongoose");

var houseSchema = new mongoose.Schema({
   name: String,
   image: [String],
   imageId: [String],
   price: String,
   location: String,
   description: String,
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      }
   ]
});

module.exports = mongoose.model("House", houseSchema);