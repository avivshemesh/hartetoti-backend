const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: [true, "Please provide a question"],
    },
    level: {
        type: String,
        enum: ["easy", "medium", "hard"],
        required: true,
    }
});
