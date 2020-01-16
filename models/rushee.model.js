const mongoose = require('mongoose');

const schema = mongoose.Schema;

const rusheeSchema = new schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    resume: {
        type: String,
        required: true,
        trim: true
    },
    elo: {
        type: Number,
        default: 1000.0
    }
}, {
    timestampes: true
});

const Rushee = mongoose.model('Rushee', rusheeSchema);

module.exports = Rushee;