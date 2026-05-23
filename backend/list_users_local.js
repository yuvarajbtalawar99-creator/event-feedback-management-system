const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  isGoogleUser: Boolean
});

const User = mongoose.model('User', userSchema);

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'URL');
    console.log('Connected to MongoDB.');
    const users = await User.find({}, 'name email role isGoogleUser');
    console.log('=== REGISTERED USERS ===');
    console.log(JSON.stringify(users, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
};

listUsers();
