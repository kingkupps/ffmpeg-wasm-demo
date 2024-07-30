const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.static("static"));

app.get("/", (_, res) => {
  res.set("Cross-Origin-Opener-Policy", "same-origin");
  res.set("Cross-Origin-Embedder-Policy", "require-corp");
  res.sendFile("./static/index.html", { root: __dirname });
});

app.listen(9000, () => {
  console.log("Server started on port 9000");
});
