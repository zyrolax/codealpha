const express = require('express');
const http = require('http');
const server = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
// const session = require('express-session');
// const MongoStore = require('connect-mongo')(session);

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

//new
const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({
  text: String,
  time: Date,
  username: String,
  roomname: String,
}));

const loginSchema = new mongoose.Schema({
  email: String,
  password: String
});

const walletSchema = new mongoose.Schema({
  userName: String,
  amount: Number
});

const pendingTransactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  request: String
});

const RoomParticipants = mongoose.model('RoomParticipants', new mongoose.Schema({
  name: String,
  roomname: String,
}));
const CompletedTransaction = mongoose.model('CompletedTransaction', new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  request: String // assuming request is the unique identifier for completed transactions
}));
//NEW
const CreatedRooms = mongoose.model('CreatedRooms', new mongoose.Schema({
  id: String,
  name: String,
  description:String,
  amount: Number,
  completionTime: Date,
  userName: String,
}));

const User = mongoose.model('User', userSchema);
const Login = mongoose.model('Login', loginSchema);
const Wallet = mongoose.model('Wallet', walletSchema);
const PendingTransaction = mongoose.model('PendingTransaction', pendingTransactionSchema);

server.use(cors());
server.use(bodyParser.json());

const httpServer = http.createServer(server);
const io = socketIO(httpServer, {
  cors: {
    origin: "http://localhost:3000",  // Adjust this to your frontend origin
    methods: ["GET", "POST"]
  }
});

let isLoggedIn = false;
let currentUserData = null;

// server.use(session({
//   secret: 'your-secret-key',
//   resave: false,
//   saveUninitialized: false,
//   // store: new MongoStore({ mongooseConnection: mongoose.connection }),
//   // cookie: { maxAge: 3600000 } // Session cookie expiration time in milliseconds (1 hour in this example)
// }));




server.post("/sendMessage", async (req, res) => {
  try {
    const { text, time, username,roomname } = req.body;

    const newMessage = new ChatMessage({
      text,
      time: new Date(time), // Convert time to a Date object
      username,
      roomname,
    });

    const savedMessage = await newMessage.save();
    io.emit('newMessage', savedMessage);

    res.json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




server.get("/getMessages", async (req, res) => {
  try {
    const { roomname } = req.query;

    // Check if roomname is provided in the query parameters
    if (!roomname) {
      return res.status(400).json({ error: "Roomname is required" });
    }

    // Retrieve messages for the specified room from the database
    const messages = await ChatMessage.find({ roomname }).sort({ time: 1 });

    res.json({ messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// server.post("/demo", async (req, res) => {
//   let user = new User();
//   user.name = req.body.name;
//   user.email = req.body.email;
//   user.password = req.body.password;
//   user.repassword = req.body.repassword;
//   const doc = await user.save();
//   res.json(doc);
// });

server.post("/demo", async (req, res) => {
  try {
    const { name, email, password, repassword } = req.body;

    // Check if all required fields are provided
    if (!name || !email || !password || !repassword) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    // Additional check for password matching
    if (password !== repassword) {
      return res.status(400).json({ error: "Password and repassword do not match" });
    }

    // Save user data to the User collection
    const newUser = new User({ name, email, password, repassword });
    const savedUser = await newUser.save();

    // Add user to wallet database with an amount of 500
    const walletData = { userName: name, amount: 500 };
    const newWalletEntry = new Wallet(walletData);
    await newWalletEntry.save();

    res.json(savedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.post("/joinDebate", async (req, res) => {
  try {
    const { userName, roomName } = req.body;

    // Check if both userName and roomName are available
    if (!userName || !roomName) {
      return res.status(400).json({ error: "Invalid user or room information" });
    }

    // Check if the user is already a participant in the room
    const existingParticipant = await RoomParticipants.findOne({ name: userName, roomname: roomName });

    if (existingParticipant) {
      return res.status(400).json({ error: "User is already a participant in the room" });
    }

    // Save the participant information to the RoomParticipants collection
    const newParticipant = new RoomParticipants({ name: userName, roomname: roomName });
    const savedParticipant = await newParticipant.save();

    res.json(savedParticipant);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.post("/test", async (req, res) => {
  const { email, password } = req.body;
  const matchingUser = await User.findOne({ email, password });
  isLoggedIn = !!matchingUser;
  io.emit('isLoggedIn', isLoggedIn);

  if (matchingUser) {
    const token = jwt.sign({
      email: matchingUser.email,
      name: matchingUser.name,
      
      // Add any other information you want to include in the token
    }, 'your-secret-key');
    res.json({ result: true,token });
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
      // const tokenData = jwt.verify(req.headers.authorization, 'your-secret-key');
      // res.json({ user: userData, tokenData });
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

server.post("/decode-token", async (req, res) => {
  try {
    const { token } = req.body;

    // Verify the token
    const decodedToken = jwt.verify(token, 'your-secret-key');

    // Extract information from the decoded token
    const { email, name } = decodedToken;

    // Send the decoded information to the client
    res.json({ name, email });
  } catch (error) {
    console.error('Error decoding token:', error);
    res.status(500).json({ error: 'Error decoding token' });
  }
});



server.get("/result", async (req, res) => {
  res.json({ result: isLoggedIn });
});


// Add this route to your server code
server.get("/getParticipants", async (req, res) => {
  try {
    const { roomname } = req.query;

    // Check if roomname is provided in the query parameters
    if (!roomname) {
      return res.status(400).json({ error: "Roomname is required" });
    }

    // Retrieve participants for the specified room from the database
    const participants = await RoomParticipants.find({ roomname });

    res.json({ participants });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
server.get("/getRooms", async (req, res) => {
  try {
    const { userName } = req.query;

    // Check if userName is provided in the query parameters
    if (!userName) {
      return res.status(400).json({ error: "username is required" });
    }

    // Retrieve rooms for the specified user from the database
    const rooms = await RoomParticipants.find({ name: userName });

    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.get("/getRoomsByName", async (req, res) => {
  try {
    const { name } = req.query;

    // Check if name is provided in the query parameters
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Retrieve rooms from the CreatedRooms collection based on the provided name
    const rooms = await CreatedRooms.find({ name: name });

    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//new
server.get("/getRoomsByUser", async (req, res) => {
  try {
    const { userName } = req.query;

    // Check if userName is provided in the query parameters
    if (!userName) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Retrieve rooms from the CreatedRooms collection based on the provided userName
    const rooms = await CreatedRooms.find({ userName });

    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// const moment = require('moment-timezone'); // Import the moment-timezone library
server.post("/createRoom", async (req, res) => {
  try {
    const { id, name, description, amount, completionTime, userName } = req.body;

    // Check if all required fields are provided
    if (!id || !name || !description || !amount || !completionTime || !userName ) {
      return res.status(400).json({ error: "Please provide all required fields" });
    }

    // const istCompletionTime = moment.utc(completionTime).tz('Asia/Kolkata').format();

    // Check if the room with the provided ID already exists
    const existingRoom = await CreatedRooms.findOne({ id });

    if (existingRoom) {
      return res.status(400).json({ error: "Room with this ID already exists" });
    }

    // Save the room data to the CreatedRooms collection
    const newRoom = new CreatedRooms({ id, name, description, amount, completionTime,userName });
    const savedRoom = await newRoom.save();

    res.json(savedRoom);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.post("/savePendingTransaction", async (req, res) => {
  try {
    const { sender, receiver, amount, request } = req.body;

    // Save the pending transaction data to the PendingTransaction collection
    const newPendingTransaction = new PendingTransaction({ sender, receiver, amount, request });
    const savedTransaction = await newPendingTransaction.save();

    res.json(savedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.get("/checkPendingTransaction", async (req, res) => {
  try {
    const { request } = req.query;

    // Check if request is provided in the query parameters
    if (!request) {
      return res.status(400).json({ error: "Request is required" });
    }

    // Check if the request exists in the PendingTransaction collection
    const pendingTransaction = await PendingTransaction.findOne({ request });

    // If a pending transaction exists for the request, return true
    const isInPendingTransaction = !!pendingTransaction;

    res.json({ isInPendingTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
server.get("/getPendingTransaction", async (req, res) => {
  try {
    const { request } = req.query;

    // Check if request is provided in the query parameters
    if (!request) {
      return res.status(400).json({ error: "Request is required" });
    }

    // Check if the request exists in the PendingTransaction collection
    const pendingTransaction = await PendingTransaction.findOne({ request });


    res.json({ pendingTransaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.delete("/deletePendingTransaction", async (req, res) => {
  try {
    const { request } = req.query;

    // Check if request is provided in the query parameters
    if (!request) {
      return res.status(400).json({ error: "Request is required" });
    }

    // Delete pending transaction data from the PendingTransaction collection based on the provided request
    const deletedPendingTransaction = await PendingTransaction.deleteOne({ request });

    // Check if any document was deleted
    if (deletedPendingTransaction.deletedCount > 0) {
      res.json({ message: "Pending transaction deleted successfully" });
    } else {
      res.status(404).json({ error: "Pending transaction not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
server.delete("/deleteRequest", async (req, res) => {
  try {
    const { request } = req.query;

    // Check if request is provided in the query parameters
    if (!request) {
      return res.status(400).json({ error: "Request is required" });
    }

    // Delete pending transaction data from the PendingTransaction collection based on the provided request
    const deletedRequest = await CreatedRooms.deleteOne({ name : request });

    // Check if any document was deleted
    if (deletedRequest.deletedCount > 0) {
      res.json({ message: "Request deleted successfully" });
    } else {
      res.status(404).json({ error: "Request not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.get("/getWallet", async (req, res) => {
  try {
    const { userName } = req.query;

    // Check if userName is provided in the query parameters
    if (!userName) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Retrieve wallet data from the Wallet collection based on the provided userName
    const walletData = await Wallet.findOne({ userName });

    // If wallet data exists for the user, return it
    if (walletData) {
      res.json({ walletData });
    } else {
      res.status(404).json({ error: "Wallet data not found for the user" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.delete("/deleteWallet", async (req, res) => {
  try {
    const { userName } = req.query;

    // Check if userName is provided in the query parameters
    if (!userName) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Delete wallet data from the Wallet collection based on the provided userName
    const deletedWalletData = await Wallet.deleteOne({ userName });

    // Check if any document was deleted
    if (deletedWalletData.deletedCount > 0) {
      res.json({ message: "Wallet data deleted successfully" });
    } else {
      res.status(404).json({ error: "Wallet data not found for the user" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.put("/updateWallet", async (req, res) => {
  try {
    const { userName, amount } = req.body;

    // Update the wallet data with the new amount
    const updatedWallet = await Wallet.findOneAndUpdate({ userName }, { amount }, { new: true });

    res.json(updatedWallet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




server.get("/getAllRooms", async (req, res) => {
  try {
    // Retrieve all rooms from the CreatedRooms collection
    const rooms = await CreatedRooms.find();

    res.json({ rooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.get("/selectedRooms", async (req, res) => {
  try {
    const { rooms } = req.query;

    // Check if room names are provided in the query parameters
    if (!rooms) {
      return res.status(400).json({ error: "Room names are required" });
    }

    // Convert the room names string to an array
    const roomNamesArray = rooms.split(',');

    // Retrieve rooms from the CreatedRooms collection based on the provided room names
    const selectedRooms = await CreatedRooms.find({ name: { $in: roomNamesArray } });

    res.json({ selectedRooms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//newww
server.get("/chatroomeligibility", async (req, res) => {
  try {
    const { room, name } = req.query;

    // Check if both room and name are provided in the query parameters
    if (!room || !name) {
      return res.status(400).json({ error: "Both room and name are required" });
    }

    // Check if a document with the provided room and name exists in RoomParticipants collection
    const participant = await RoomParticipants.findOne({ roomname: room, name: name });

    // If a participant exists, the user is eligible for the chat room
    const isEligible = !!participant;

    res.json({ isEligible });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


server.post("/completedTransaction", async (req, res) => {
  try {
    const { sender, receiver, amount, request } = req.body;

    // Save the completed transaction data to the CompletedTransaction collection
    const completedTransaction = new CompletedTransaction({ sender, receiver, amount, request });
    await completedTransaction.save();

    console.log("Completed transaction saved successfully");

    // Send response to indicate success
    res.status(200).json({ message: "Completed transaction saved successfully" });
  } catch (error) {
    console.error('Error saving completed transaction:', error.message);
    // Send error response
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.post("/check-username", async (req, res) => {
  try {
    const { username } = req.body;

    // Check if the username already exists in the User collection
    const existingUser = await User.findOne({ name: username });

    // If the username exists, return true
    const isUsernameTaken = !!existingUser;

    res.json({ isUsernameTaken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

server.post("/check-roomname", async (req, res) => {
  try {
    const { name } = req.body;

    // Check if the room name already exists in the CreatedRooms collection
    const existingRoom = await CreatedRooms.findOne({ name });

    // If the room name exists, return true
    const isRoomNameTaken = !!existingRoom;

    res.json({ isRoomNameTaken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
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
