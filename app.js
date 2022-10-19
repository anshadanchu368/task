//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const gtts = require("node-gtts")("en");
var multer = require("multer");
var ImgModel = require("./model");
const { exec } = require("child_process");
const bodyparser = require("body-parser");
var videoshow = require("videoshow");
var VideoFile = require("./videofile");
const fs = require("fs");
var path = require("path");
const { response } = require("express");
const fileUpload = require("express-fileupload");
const app = express();
var list = "";

var listFilePath = "public/uploads/" + Date.now() + "list.txt";

var outputFilePath = Date.now() + "output.mp4";

var dir = "public";
var subDirectory = "public/uploads";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);

  fs.mkdirSync(subDirectory);
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

const videoFilter = function (req, file, cb) {
  // Accept videos only
  if (!file.originalname.match(/\.(mp4)$/)) {
    req.fileValidationError = "Only video files are allowed!";
    return cb(new Error("Only video files are allowed!"), false);
  }
  cb(null, true);
};

var upload = multer({ storage: storage, fileFilter: videoFilter });

app.set("view engine", "ejs");

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(express.static("public"));//////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(express.static("tmp"));//////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(express.static("uploads"));//////////////////////////////////////////////////////////////////////////////////////////////////////////
app.use(fileUpload());

mongoose.connect("mongodb://localhost:27017/taskDB");

const taskSchema = {
  status: String,
  message: String,
};

const Task = mongoose.model("Task", taskSchema);

const Storage = multer.diskStorage({
  destination: "uploads",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const uploads = multer({
  storage: Storage,
}).single("testImage");

app.get("/",function(req, res){
  res.send(Task);
})

app.get("/create_new_storage", (req, res) => {
  Task.find(function (err, task) {
    if (err) {
      console.log(err);
    } else {
      res.send(task);
    }
  });
});

app.post("/create_new_storage", function (req, res) {
  const newTask = new Task({
    status: req.body.status,
    message: req.body.message,
  });

  newTask.save(function (err) {
    if (!err) {
      res.send("Successfully created a new task.");
    } else {
      res.send(err);
    }
  });
});

app.post("/upload_file", function (req, res) {
  uploads(req, res, (err) => {
    if (err) {
      console.log(err);
    } else {
      const newImage = ImgModel({
        status: req.body.status,
        file_path: {
          data: req.file.filename,
          contentType: "image/png",
        },
      });
      newImage.save(function (err) {
        if (!err) {
          res.send(newImage.status + (__filename + newImage.file_path));
        } else {
          console.log(err);
        }
      });
    }
  });
});

const Store = multer.diskStorage({
  destination: "tmp",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const tmp = multer({
  store: Store,
}).single("test");

app.post("/text_file_to_audio", function (req, res) {
  var filepath = path.join(__dirname, "tmp/i-love-you.wav");

  gtts.save(filepath, req.body.text, function () {
    console.log("converted");
  });

  const cnvrted = new Task({
    status: req.body.status,
    message: req.body.message,
    audio_file_path: req.path.filepath,
  });
  cnvrted.save(function (err, theaudio) {
    if (!err) {
      res.send(theaudio);
    } else {
      console.log(err);
    }
  });
});

const Stor = multer.diskStorage({
  destination: "videos",
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const videoshoo = multer({
  stor: Stor,
}).single("testVideo");

app.post("/merge_image_and_audio", function (req, res) {
  var audio = __dirname + "i-love-you.wav"; //req.files.audio[0].path;
 
  var image = [__dirname + "admin2.png"]; //req.files.image[0].path

  var audioParams = {
    fade: true,
    delay: 2, // seconds
  };
  var videoOptions = {
    videoBitrate: 1024,
    videoCodec: "libx264",
    size: "640x?",
    audioBitrate: "128k",
    audioChannels: 2,
    format: "mp4",
  };

  videoshoo(image, videoOptions)
    .audio(audio, audioParams)
    .save("video.mp4")
    .on("start", function (command) {
      console.log("ffmpeg process started:", command);
    })
    .on("error", function (err) {
      console.error("Error:", err);
    })
    .on("end", function (output) {
      console.log("Video created in:", output);
    });

  const videos = new VideoFile({
    status: req.body.status,
    message: req.body.message,
    video_file_path: {
      data: req.file.filename,
      contentType: "video/mp4",
    },
  });

  res.send(videos);
});
var mvideos="";
var audio_file_path ="/tmp/i-love-you.wav";//////////////////////////////////////////////////////////////////////////////////////////////////////
var video_file_path="public/mvideos.mp4";

var dir = "public";
var subDirectory = "videos";

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);

  fs.mkdirSync(subDirectory);
}

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(__dirname, 'public/videos/files'));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage});



app.post("/merge_video_and_audio",upload.array("files",1000), function (req, res) {
  mvideos="";
  if (req.files) {
    req.files.forEach((file) => {
      mvideos += `file ${file.filename}`;
      mvideos += "\n";
    });

    var writeStream = fs.createWriteStream(audio_file_path);

      writeStream.write(mvideos);

      writeStream.end();

      exec(
        `ffmpeg -safe 0 -f concat -i ${audio_file_path} -c copy ${video_file_path}`,
        (error, stdout, stderr) => {
          if (error) {
            console.log(`error: ${error.message}`);
            return;
          } else {
            console.log("video and audio are successfully merged");
            res.download(video_file_path, (err) => {
              if (err) throw err;
  
              req.files.forEach((file) => {
                fs.unlinkSync(file.path);
              });
  
              fs.unlinkSync(audio_file_path);
              fs.unlinkSync(video_file_path);
            });
          }
        }
      );
      res.send(mvideos);
  }

 
});

app.post("/merge_all_videos", upload.array("files", 1000), (req, res) => {
  list = " ";
  if (req.files) {
    req.files.forEach((file) => {
      list += `file ${file.filename}`;
      list += "\n";
    });

    var writeStream = fs.createWriteStream(listFilePath);

    writeStream.write(list);

    writeStream.end();

    exec(
      `ffmpeg -safe 0 -f concat -i ${listFilePath} -c copy ${outputFilePath}`,
      (error, stdout, stderr) => {
        if (error) {
          console.log(`error: ${error.message}`);
          return;
        } else {
          console.log("videos are successfully merged");
          res.download(outputFilePath, (err) => {
            if (err) throw err;

            req.files.forEach((file) => {
              fs.unlinkSync(file.path);
            });

            fs.unlinkSync(listFilePath);
            fs.unlinkSync(outputFilePath);
          });
        }
      }
    );
  }
  const mergedallvid = VideoFile({
    status: req.body.status,
    message: req.body.message,
    video_file_path: {
      data: req.files,
    },
  });
  res.send(mergedallvid);
});

app.get("/download_file", (req, res) => {
  const filePath = `${__dirname}/public/videos/files/video.mp4/`;

  const stream = fs.createReadStream(filePath);

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');

  stream.pipe(res);
});

app.get("/my_uploaded_file", (req, res) => {
  if (!req.files) {
    return res.status(400).send("No files were uploaded.");
  }

  const file = req.files;
  const path = __dirname + "/files/" + file.name;

  file.mv(path, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    return res.send({ status: "success", path: path });
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started on port 3000");
});

//find ffmpeg to merge video and audio.
