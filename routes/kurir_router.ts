import express from 'express';
import type { Request, Response } from 'express';
import PendafaranBaruModel from '../models/pendaftaran_baru_model';
import KurirModel from '../models/kurir_model';
import type { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/kurir_ui/index.html');
});

router.get('/login', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/kurir_ui/login.html');
});

router.post('/login', async (req: Request, res: Response) => {
    const { no_telpon, password } = req.body;

    try {
        const user = await KurirModel.findOne({ no_telpon, password });
        if (user) {
            res.status(200).json(user);
            return;
        }
        res.status(400).json('Nomor Telpon atau Password Salah');
        return;
    } catch (error) {
        console.log("error di kurir login",error);
        res.status(500).json('Terjadi Kesalahan Server');
        return;
    }
    
});

router.get('/:jenis/:gambar', (req: Request, res: Response) => {
    const { jenis, gambar } = req.params;
    const imagePath = path.join(__dirname, `../images/${jenis}/${gambar}`);

    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        res.status(404).send('Image not found');
    }
    
})

router.post('/check', async (req: Request, res: Response) => {
    if (!req.body) {
        res.status(400).json('Bad Request');
        return;
    }
    const { _id, no_telpon, password, createdAt } = req.body;
    console.log(_id , no_telpon , password , createdAt);

    // console.log(_id , no_telpon , password , createdAt);
    try {
        // check the user by _id , no_telpon , password , createdAt
        const user = await KurirModel.findOne({ _id, no_telpon, password, createdAt });
        if (!user) {
            res.status(400).json('User not found');
            return;
        }

        res.status(200).json('Success');
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json('Terjadi Kesalahan Server');
        return
    }

})



export default router;