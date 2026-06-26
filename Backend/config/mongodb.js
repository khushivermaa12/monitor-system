const mongoose = require('mongoose')
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/platform-monitor"
const connectDB = async () => {
    mongoose.connection.on('connected', () => {
        console.log("DB Connected");
    })
    await mongoose.connect(MONGO_URI)

}
module.exports = connectDB;