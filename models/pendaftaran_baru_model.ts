import mongoose from "mongoose";

const PendaftaranBaruSchema = new mongoose.Schema({
    no_telpon: { type: String, required: true, unique: true },
    nama: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: true },
}, {
    timestamps: true // This auto-adds createdAt and updatedAt
});

const PendafaranBaruModel = mongoose.model('Pendaftaran_Baru_Collection', PendaftaranBaruSchema);

export default PendafaranBaruModel;