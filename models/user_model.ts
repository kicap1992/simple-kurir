import mongoose  from "mongoose";

const userSchema = new mongoose.Schema({
    no_telpon: { type: String, required: true, unique: true },
    nama: { type: String, required: true },
    password: { type: String, required: true },
    alamat: { type: String, required: false },
    gambar: { type: String, required: false },

}, {
    timestamps: true // This auto-adds createdAt and updatedAt
});

const UserModel = mongoose.model('User_Collection', userSchema);

export default UserModel;