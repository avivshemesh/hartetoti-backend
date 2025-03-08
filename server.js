const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dbHandler");
const registerRoutes = require('./routes');
const cookieParser = require('cookie-parser')

require("dotenv").config();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const origins = [
  process.env.HARTETOTI_FRONT_URL
]

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    if (origins.includes(origin) || !origin) {
      // Allow requests with no origin (like mobile apps or curl requests)
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

registerRoutes(app);

app.get("/", (req, res) => {
  res.send("Hello from the backend with MongoDB!");
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // export needed for testing
