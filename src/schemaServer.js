const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();

// Enable CORS for all routes
app.use(cors());
// Serve static files from the "schemas" directory
app.use("/schemas", express.static(path.join(__dirname, "schemas")));

app.listen(3010, () => {
  console.log("Server is running on http://localhost:3010");
});
