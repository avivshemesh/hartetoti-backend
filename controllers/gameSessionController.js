const gameSessionService = require("../services/gameSessionService");

class GameSessionController {
    async createGameSession(req, res) {
        try {
            const gameSessionData = await gameSessionService.createGameSession(req.body, req.user._id);

            res.status(201).json({
                success: true,
                message: `Game session created with ID: ${gameSessionData._id}`,
                sessionId: gameSessionData._id,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    async getGameSession(req, res) {
        try {
            const gameSessionData = await gameSessionService.getGameSession(req.params.id, req.user._id);

            res.status(200).json({
                success: true,
                message: `Game session get with ID: ${gameSessionData._id}`,
                sessionId: gameSessionData._id,
            })
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            })
        }
    }
}

module.exports = new GameSessionController();
