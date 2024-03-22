const express = require('express');
const server = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

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



server.post("/demo", async (req, res) => {
  let user = new User();
  user.name = req.body.name;
  user.email = req.body.email;
  user.password = req.body.password;
  user.repassword = req.body.repassword;
  const doc = await user.save();
  console.log(doc);
  res.json(doc);
});

server.post("/test", async (req, res) => {
  const { email, password } = req.body;

  // Check if there is a matching user in the User database
  const matchingUser = await User.findOne({ email, password });

  if (matchingUser) {
    // If a matching user is found, respond with TRUE
    console.log("TRUE");
    res.json({ result: true });
  } else {
    // If no matching user is found, respond with FALSE
    console.log("FALSE");
    res.json({ result: false });
  }
});


// server.post("/test", async (req, res) => {
//   let login = new Login();
//   login.email = req.body.email;
//   login.password = req.body.password;
//   const doc = await login.save();
//   console.log(doc);
//   res.json(doc);
// });

server.listen(8080, () => {
  console.log("server started");
});
