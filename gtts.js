var mongoose =require("mongoose");

var gttsSchema = new mongoose.Schema({
    status:String,
    message:String,
    audio_file_path:
    {
        data: Buffer,
        contentType: String
    }
});

module.exports = gTTS = mongoose.model("converted",gttsSchema);

