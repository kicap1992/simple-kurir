import mongoose from "mongoose";

const kurirSchema = new mongoose.Schema({
    no_telpon: { type: String, required: true, unique: true },
    password: { type: String },
    nama: { type: String, required: true },
    jenis_kelamin: { type: String, required: true },
    dd_motor: { type: String, required: true, unique: true },
    gambar_kurir: { type: String, required: true },
    gambar_motor: { type: String, required: true },
    status: { type: String },
}, {
    timestamps: true // This auto-adds createdAt and updatedAt
});

const KurirModel = mongoose.model('Kurir_Collection', kurirSchema);

export default KurirModel;