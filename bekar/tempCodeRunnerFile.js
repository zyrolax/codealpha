const express = require('express');
const http = require('http');
const server = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const socketIO = require('socket.io');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/Startup');
  console.log("db connected");
}

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  repassword: String
});

const loginSchema = new mongoose.Schema({
  email: String,
  password: String
});

const User = mongoose.model('User', userSchema);
const Login = mongoose.model('Login', loginSchema);

server.use(cors());
server.use(bodyParser.json());

const httpServer = http.createServer(server);
const io = socketIO(httpServer, {
  cors: {
    origin: "http://localhost:3001",  // Adjust this to your frontend origin
    methods: ["GET", "POST"]
  }
});

let isLoggedIn = false;
let currentUserData = null;

server.post("/demo", async (req, res) => {
  let user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.password = req.body.password;
  user.repassword = req.body.repassword;
  const doc = await user.save();
  res.json(doc);
});

server.post("/test", async (req, res) => {
  const { email, password } = req.body;
  const matchingUser = await User.findOne({ email, password });
  isLoggedIn = !!matchingUser;
  io.emit('isLoggedIn', isLoggedIn);

  if (matchingUser) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

server.post("/profile", async (req, res) => {
  if (isLoggedIn) {
    const { email, password } = req.body;
    const userData = await User.findOne({ email, password });

    if (userData) {
      currentUserData = userData; // Update the variable with the current user data
      res.json(userData);
    } else {
      res.json({ message: "User data not found" });
    }
  } else {
    res.json({ message: "User is not logged in" });
  }
});

server.get("/profile", async (req, res) => {
  if (isLoggedIn) {
    if (currentUserData) {
      res.json({ user: currentUserData });
    } else {
      res.json({ message: "User data not found" });
    }
  } else {
    res.json({ message: "User is not logged in" });
  }
});

server.get("/result", async (req, res) => {
  res.json({ result: isLoggedIn });
});

io.on('connection', (socket) => {
  socket.on('logout', () => {
    isLoggedIn = false; // Set isLoggedIn to false when 'logout' event is received
    io.emit('isLoggedIn', isLoggedIn);
  });
});

httpServer.listen(8080, () => {
  console.log("server started");
});
