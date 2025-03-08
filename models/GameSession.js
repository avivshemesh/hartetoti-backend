const mongoose = require("mongoose");

const GameSessionSchema = new mongoose.Schema({
    gameMode: {
        type: String,
        enum: ["classic", "speed run"],
        required: [true, "Please provide a game mode"]
    },
    secondsPerQuestion: {
        type: Number,
        required: [true, "Please provide seconds per question"],
        min: 1
    },
    questionCount: {
        type: Number,
        required: function() {
            return this.gameMode === "classic";
        },
        default: function() {
            return this.gameMode === "speed run" ? 200 : undefined;
        },
        min: 1
    },
    status: {
        type: String,
        enum: ["created", "active", "completed", "abandoned"],
        default: "created"
    },
    score: {
        type: Number,
        default: 0
    },
    questionsAnswered: {
        type: Number,
        default: 0
    },
    correctAnswers: {
        type: Number,
        default: 0
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    startedAt: {
        type: Date
    },
    completedAt: {
        type: Date
    },
    lastAccessedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

GameSessionSchema.methods.startGame = function() {
    this.status = "active";
    this.startedAt = Date.now();
    return this.save();
};

GameSessionSchema.methods.completeGame = function(score, questionsAnswered, correctAnswers) {
    this.status = "completed";
    this.completedAt = Date.now();
    this.score = score || this.score;
    this.questionsAnswered = questionsAnswered || this.questionsAnswered;
    this.correctAnswers = correctAnswers || this.correctAnswers;
    return this.save();
};

GameSessionSchema.methods.abandonGame = function() {
    this.status = "abandoned";
    return this.save();
};

GameSessionSchema.methods.getDuration = function() {
    if (!this.startedAt) return 0;

    const endTime = this.completedAt || Date.now();
    return Math.floor((endTime - this.startedAt) / 1000);
};

GameSessionSchema.virtual('completionPercentage').get(function() {
    if (this.gameMode !== "classic" || !this.questionCount) return 0;
    return Math.floor((this.questionsAnswered / this.questionCount) * 100);
});

GameSessionSchema.index({ userId: 1, createdAt: -1 });
GameSessionSchema.index({ status: 1 });

const GameSession = mongoose.model("GameSession", GameSessionSchema);

module.exports = GameSession;
