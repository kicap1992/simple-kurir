// create admin router
import express from 'express';
import type { Request, Response } from 'express';
import type { UploadedFile } from 'express-fileupload';
import KirimanModel from '../models/kiriman_model';
import path from 'path';
import fs from 'fs';
import KurirModel from '../models/kurir_model';
import UserModel from '../models/user_model';
import axios from 'axios';
import { socket_client } from '../index';


const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/index.html');
});

router.get('/kurir', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/kurir.html');
})

router.get('/kurir/data', (req: Request, res: Response) => {
    KurirModel.find().then((data) => {
        res.json(data);
    });
})

router.get('/kurir/gambar/:no_telpon/:jenis', (req: Request, res: Response) => {
    const { no_telpon, jenis } = req.params;
    if (!no_telpon) {
        res.status(400).json({ error: 'No Telpon is required.' });
        return
    }
    KurirModel.findOne({ no_telpon }).then((data) => {
        // if data not found
        if (!data) {
            res.status(404).json({ error: 'Kurir not found.' });
            return
        }
        // Define file paths
        const motorGambar = path.join(__dirname, '../images/' + jenis + '/' + data.gambar_motor);
        const kurirGambar = path.join(__dirname, '../images/kurir/' + data.gambar_kurir);

        if (jenis == 'motor') {
            res.sendFile(motorGambar);
        } else {
            res.sendFile(kurirGambar);
        }
    })
})

router.get('/kurir/:no_telpon', (req: Request, res: Response) => {
    const { no_telpon } = req.params;
    if (!no_telpon) {
        res.status(400).json({ error: 'No Telpon is required.' });
        return
    }

    KurirModel.findOne({ no_telpon }).then((data) => {
        // if data not found
        if (!data) {
            res.status(404).json({ error: 'Kurir not found.' });
            return
        }
        res.json(data);

    });
})

router.post('/kurir', async (req: Request, res: Response) => {
    try {
        const { dd_motor, nama, no_telpon, jenis_kelamin } = req.body;
        const { gambar_kurir, gambar_motor } = req.files as {
            gambar_kurir: UploadedFile;
            gambar_motor: UploadedFile;
        };

        // Check if kurir already exists by no_telpon or dd_motor
        const existing = await KurirModel.findOne({
            $or: [{ no_telpon }, { dd_motor }],
        });

        if (existing) {
            // await new Promise((resolve) => setTimeout(resolve, 2000));
            res.status(400).json({
                error: 'Nomor telepon atau motor sudah terdaftar.',
            });
            return;
        }

        const random_5_char = Math.random().toString(36).substring(2, 7);


        // Define file paths
        const kurirDir = path.join(__dirname, '../images/kurir');
        const motorDir = path.join(__dirname, '../images/motor');
        const kurirPath = path.join(kurirDir, `${no_telpon}_kurir_${random_5_char}.jpg`);
        const motorPath = path.join(motorDir, `${no_telpon}_motor_${random_5_char}.jpg`);

        // Ensure dirs exist
        fs.mkdirSync(kurirDir, { recursive: true });
        fs.mkdirSync(motorDir, { recursive: true });

        // Move files
        await gambar_kurir.mv(kurirPath);
        await gambar_motor.mv(motorPath);

        // Save to MongoDB
        const newKurir = new KurirModel({
            no_telpon,
            password: no_telpon,
            nama,
            jenis_kelamin,
            dd_motor,
            gambar_kurir: `${no_telpon}_kurir_${random_5_char}.jpg`,
            gambar_motor: `${no_telpon}_motor_${random_5_char}.jpg`,
        });

        await newKurir.save();
        // await 2 sec
        // await new Promise((resolve) => setTimeout(resolve, 2000));

        res.status(201).json({ message: 'Kurir berhasil ditambahkan.' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

router.get('/check-kurir/tersedia', (req: Request, res: Response) => {
    try {
        // search by status = "Tersedia" || null || undefined
        KurirModel.find({ status: { $in: ['Tersedia', null, undefined] } }).then((data) => {
            res.json(data);
        });
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
})

router.get('/paket-baru', async (req: Request, res: Response) => {
    try {
        // search by status != "Dibatalkan Oleh Admin"
        const response = await KirimanModel.find({
            status: {
                $nin: ['Dibatalkan Oleh Admin','Paket Telah Diterima Penerima','Diterima Terverifikasi', "Dibatalkan Oleh Pengirim"],
                $type: 'string'
            }
        });
        // console.log(response);
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
})

router.get('/paket-all', async (req: Request, res: Response) => {
    try {
        // search by status != "Dibatalkan Oleh Admin"
        const response = await KirimanModel.find();
        // console.log(response);
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
})


router.delete('/batalkan-pengiriman/', async (req: Request, res: Response) => {
    try {
        // const { id } = req.params;
        const { alasan, id } = req.body; // optional reason from admin (e.g., from SweetAlert input)
        // console.log(id, alasan);

        const updatedDoc = await KirimanModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    status: 'Dibatalkan Oleh Admin'
                },
                $push: {
                    timeline: {
                        status: 'Dibatalkan Oleh Admin',
                        waktu: new Date(),
                        alasan: alasan || null
                    }
                }
            },
            { new: true } // Return the updated document
        );
        // console.log(updatedDoc);
        const userData = await UserModel.findById(updatedDoc?.id_pengirim);

        // console.log(userData)
        socket_client.emit('pembatalan_paket', updatedDoc);

        try {
            await axios.post('http://localhost:3012/send-message', { number: userData?.no_telpon, message: `🛵*_Kurir Shenior 🛵_*\nPengiriman anda dengan nomor resi ${updatedDoc?._id} telah dibatalkan oleh admin\nAlasan: *${alasan || 'Belum ada alasan'}* ❌❌` });
        } catch (err) {
            console.log(err);
        }


        res.status(200).json("response");
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
});

router.post('/tugaskan-kurir', async (req: Request, res: Response) => {
    const { id_kiriman, id_kurir } = req.body;
    console.log(id_kiriman, id_kurir);
    try {
        const updatedDoc = await KirimanModel.findByIdAndUpdate(
            id_kiriman,
            {
                $set: {
                    status: 'Kurir Telah Ditugaskan',
                    id_kurir: id_kurir
                },
                $push: {
                    timeline: {
                        status: 'Kurir Telah Ditugaskan',
                        waktu: new Date(),
                        // alasan: alasan || null
                    }
                }
            },
            { new: true } // Return the updated document
        );

        await KurirModel.findByIdAndUpdate(
            id_kurir,
            {
                $set: {
                    status: 'Ditugaskan'
                }
            },
            { new: true } // Return the updated document
        );

        console.log(updatedDoc);

        socket_client.emit('tugaskan_kurir_server', updatedDoc);

        try {
            const userData = await UserModel.findById(updatedDoc?.id_pengirim);
            const kurirData = await KurirModel.findById(id_kurir);
            await axios.post('http://localhost:3012/send-message', { number: userData?.no_telpon, message: `🛵 * _Kurir Shenior 🛵_*\nPengiriman anda dengan nomor resi ${updatedDoc?._id} \nStatus : *Kurir Telah DItugaskan*✅✅` });
            await axios.post('http://localhost:3012/send-message', { number: kurirData?.no_telpon, message: `🛵 *_Kurir Shenior 🛵_*\nAnda telah ditugaskan untuk mengirim paket\nNomor Resi : *${updatedDoc?._id}*\nAlamat Paket : _*${updatedDoc?.alamat_pengirim}* _\nSila buka situs Kurir Shenior dan login untuk detail lebih lanjut ✅✅` });
        } catch (err) { console.log(err) }

        res.status(200).json(updatedDoc);

    } catch (err) {
        console.log(err);
        res.status(500).json([]);
    }
});


// ini untuk user
router.get('/user', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/user.html');
});

router.get('/user/data', async (req: Request, res: Response) => {
    try {
        const data = await UserModel.find();
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
});

router.get('/user/data/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(id, "ini id");
    try {
        const data = await UserModel.findById(id);
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
});

// ini untuk list penghantaran
router.get('/list', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/list.html');
});


router.get('/login', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/login.html');
});


export default router;