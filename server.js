const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dbHandler");
require("dotenv").config();

if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("Hello from the backend with MongoDB!");
});

// Start the server
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app; // export needed for testing
