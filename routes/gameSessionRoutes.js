const express = require("express");
const router = express.Router();
const gameSessionController = require("../controllers/gameSessionController");
const { protect } = require("../middleware/authMiddleware");

// all game sessions routes are protected
router.use(protect);

router.post("/create-game-session", gameSessionController.createGameSession);
router.get("/:id", gameSessionController.getGameSession);

module.exports = router;
