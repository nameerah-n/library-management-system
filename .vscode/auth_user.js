const jwt = require('jsonwebtoken');

class Stack {
  constructor() {
    this.items = [];
  }
  push(item) {
    this.items.push(item);
  }
  toArray() {
    return [...this.items];
  }
}

class HashMap {
  constructor() {
    this.map = {};
  }
  set(key, value) {
    this.map[key] = value;
  }
  get(key) {
    return this.map[key];
  }
  has(key) {
    return key in this.map;
  }
}

const users = new HashMap();      
const loginLogs = new HashMap();   
const SECRET_KEY = 'your_secret_key'; 

function fakeHash(password) {
  return password.split('').reverse().join('');
}

//REGISTERING USER

function registerUser(username, password, role) {
  if (!username || !password || !role) {
    return { success: false, message: 'All fields are required.' };
  }

  if (users.has(username)) {
    return { success: false, message: 'Username already exists.' };
  }

  if (role !== 'user' && role !== 'admin') {
    return { success: false, message: 'Role must be user or admin.' };
  }

  users.set(username, {
    password: fakeHash(password),
    role,
    failedAttempts: 0,
  });

  loginLogs.set(username, new Stack());

  return { success: true, message: 'User registered successfully.' };
}

//USER LOGIN

function loginUser(username, password, maxAttempts = 3) {
  if (!users.has(username)) {
    return { success: false, message: 'Invalid username or password.' };
  }

  const user = users.get(username);
  const hashed = fakeHash(password);

  if (user.password !== hashed) {
    user.failedAttempts++;
    if (user.failedAttempts >= maxAttempts) {
      return { success: false, message: 'Too many failed attempts.' };
    }
    return {
      success: false,
      message: `Wrong credentials. Attempts left: ${maxAttempts - user.failedAttempts}`,
    };
  }

  user.failedAttempts = 0;

  // Generate JWT token
  const token = jwt.sign({ username: username, role: user.role }, SECRET_KEY, {
    expiresIn: '1h', // Token expires in 1 hour
  });

  const stack = loginLogs.get(username);
  stack.push(new Date().toISOString()); // log login time

  return {
    success: true,
    message: `Logged in as ${username} (${user.role})`,
    token, // Send token back to user
    recentLogins: stack.toArray(),
  };
}

//MANAGING PROFILE

function updateUserProfile(username, newPassword, newRole) {
  if (!users.has(username)) {
    return { success: false, message: 'User not found.' };
  }

  const user = users.get(username);

  if (newPassword) {
    user.password = fakeHash(newPassword);
  }

  if (newRole && (newRole === 'user' || newRole === 'admin')) {
    user.role = newRole;
  }

  return { success: true, message: 'Profile updated successfully.' };
}

function getUserProfile(username) {
  if (!users.has(username)) {
    return { success: false, message: 'User not found.' };
  }

  const user = users.get(username);
  return { success: true, user };
}

module.exports = { registerUser, loginUser, updateUserProfile, getUserProfile };
