// create admin router
import express from 'express';
import type { Request, Response } from 'express';
import type { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import KurirModel from '../models/kurir_model';


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
        const motorGambar = path.join(__dirname, '../images/'+ jenis +'/'+data.gambar_motor);
        const kurirGambar = path.join(__dirname, '../images/kurir/'+data.gambar_kurir);

        if(jenis == 'motor') {
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
            dd_motor,
            nama,
            no_telpon,
            jenis_kelamin,
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



router.get('/login', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/admin_ui/login.html');
});


export default router;