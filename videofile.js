var mongoose =require("mongoose");

var VideoSchema = new mongoose.Schema({
    status:String,
    message:String,
    video_file_path:
    {
        data: String,
        contentType: String
    }
});

module.exports = VideoFile = mongoose.model("merged",VideoSchema);
