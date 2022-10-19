var mongoose = require('mongoose');
  
var imageSchema = new mongoose.Schema({
    status:String,
    file_path:
    {
        data: Buffer,
        contentType: String
    }
});
  
  
module.exports = ImgModel= mongoose.model('Image', imageSchema);