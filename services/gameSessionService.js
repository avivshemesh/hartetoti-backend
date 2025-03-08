const GameSession = require('../models/GameSession');
const Question = require('../models/Question');


class GameSessionService {
    async createGameSession(gameSessionData, userId) {
        const { gameMode, secondsPerQuestion, questionCount } = gameSessionData;

        if (!gameMode || !secondsPerQuestion || (gameMode === 'classic' && !questionCount)) {
            throw new Error('Missing required game settings');
        }

        const gameSession = new GameSession({
            gameMode,
            secondsPerQuestion,
            questionCount: gameMode === 'classic' ? questionCount : undefined,
            userId
        });

        await gameSession.save();
        return gameSession;
    }

    async getGameSession(gameSessionId, userId) {
        if (!mongoose.Types.ObjectId.isValid(gameSessionId)) {
            throw new Error("Invalid session ID");
        }

        const gameSession = await GameSession.findOne({
            _id: gameSessionId,
            userId
        });

        if (!gameSession) {
            throw new Error("Game session not found");
        }

        const requiredCount = gameSession.gameMode === 'classic'
            ? gameSession.questionCount
            : 200;

        const questions = await Question.aggregate([
            { $sample: { size: requiredCount } }
        ]);

        if (gameSession.status === 'created') {
            await gameSession.startGame();
        } else {
            gameSession.lastAccessedAt = Date.now();
            await gameSession.save();
        }

        return {
            gameSession,
            questions
        };
    }
}

module.exports = new GameSessionService();
