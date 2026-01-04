const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const helmet = require("helmet");
const morgan = require("morgan");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const User = require("./models/User");
const userRoute = require("./routes/users");
const authRoute = require("./routes/auth");
const postRoute = require("./routes/posts");
const conversationRoute = require('./routes/conversations')
const messageRoute = require('./routes/messages')
const productRoute = require('./routes/products')
const friendsRoute = require('./routes/friends')
const productMessageRoute = require('./routes/productMessages')
const commentRoute = require('./routes/comments')
const adminRoute = require('./routes/admin')
const adsRoute = require('./routes/ads')
const productActivitiesRoute = require('./routes/productActivities')
const notificationsRoute = require('./routes/notifications')
const searchRoute = require('./routes/search')
const { initializeSocket, setupNotificationHandlers } = require("./socket/notificationSocket");

const router = express.Router();

dotenv.config();

// Ensure the images directory exists
const imagesDir = path.join(__dirname, "public/images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    // Ensure default admin exists
    (async () => {
      try {
        const email = "bibek@bibek.com";
        const plainPassword = "bibek";
        let admin = await User.findOne({ email });
        const hashed = await bcrypt.hash(plainPassword, 10);
        if (!admin) {
          admin = new User({
            username: "bibek",
            fullName: "Bibek Admin",
            email,
            contactNumber: "0000000000",
            bio: "System administrator",
            interest: ["admin", "system"],
            dateOfBirth: new Date("1990-01-01"),
            location: "Kathmandu Valley",
            password: hashed,
            isAdmin: true,
          });
          await admin.save();
          console.log("Default admin user created: ", email);
        } else {
          // Ensure admin flag and password
          const updates = { isAdmin: true };
          // Always set to requested password per user's instruction
          updates.password = hashed;
          await User.updateOne({ _id: admin._id }, { $set: updates });
          console.log("Default admin ensured/updated: ", email);
        }
      } catch (e) {
        console.error("Admin seed error:", e);
      }
    })();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
app.use("/images", express.static(path.join(__dirname, "public/images")));
// Also serve under /api/images for CRA dev proxy setups
app.use("/api/images", express.static(path.join(__dirname, "public/images")));

//middleware
app.use(cors());
app.use(express.json());
// app.use(helmet());
// app.use(morgan("common"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    // If client provided a specific name (legacy behavior), honor it
    if (req.body && req.body.name) {
      return cb(null, req.body.name);
    }
    // Otherwise, generate a unique name based on original
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (req.file) {
      // Return the filename that was saved
      return res.status(200).json({ 
        message: "File uploaded successfully",
        filename: req.file.filename 
      });
    } else {
      return res.status(400).json("No file uploaded");
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json("Upload failed");
  }
});

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/conversations",conversationRoute)
app.use("/api/message",messageRoute)
app.use("/api/products",productRoute)
app.use("/api/friends",friendsRoute)
app.use("/api/productMessages",productMessageRoute)
app.use("/api/comments",commentRoute)
app.use("/api/admin", adminRoute)
app.use("/api/ads", adsRoute)
app.use("/api/productActivities", productActivitiesRoute)
app.use("/api/notifications", notificationsRoute)
app.use("/api/search", searchRoute)

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Configure this appropriately for production
  },
});

initializeSocket(io);

io.on("connection", (socket) => {
  console.log("a user connected");
  
  // Setup notification handlers
  setupNotificationHandlers(socket);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

const PORT = process.env.PORT || 8800;
server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}!`);
});
