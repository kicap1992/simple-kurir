import mongoose from "mongoose";

const timelineItemSchema = new mongoose.Schema({
  status: { type: String, required: true },
  waktu: { type: Date, default: Date.now },
  gambar: { type: String }, // optional image for this step
  alasan: { type: String }, // optional text for this step
  id_kurir: { type: String }
}, { _id: false }); // _id: false to prevent auto _id in sub-docs

const kirimanSchema = new mongoose.Schema({
  id_pengirim: { type: String, required: true },
  no_telpon_pengirim: { type: String, required: true },
  nama_pengirim: { type: String, required: true },
  alamat_pengirim: { type: String, required: true },

  no_telpon_penerima: { type: String, required: true },
  nama_penerima: { type: String, required: true },
  alamat_penerima: { type: String, required: true },

  gambar_paket: { type: String, required: true },
  id_kurir: { type: String },

  status: { type: String, default: 'Menunggu Admin Memproses' },

  timeline: {
    type: [timelineItemSchema],
    default: () => ([{
      status: 'Menunggu Admin Memproses',
      waktu: new Date()
    }])
  }

}, {
  timestamps: true
});

const KirimanModel = mongoose.model('Kiriman_Collection', kirimanSchema);

export default KirimanModel;
