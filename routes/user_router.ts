import express from 'express';
import type { Request, Response } from 'express';
import PendafaranBaruModel from '../models/pendaftaran_baru_model';
import UserModel from '../models/user_model';
import type { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import axios from 'axios';

const router = express.Router();
import * as socket from '../socket';
const socket_client = socket.clientSocket;

router.get('/', (req: Request, res: Response) => {
    // socket_client.emit('scan_dia', 'test');
    res.sendFile(__dirname + '/user_ui/index.html');
});

// router.get('/coba', async (req: Request, res: Response) => {
//     res.status(200).json('success');
// })

router.get('/login', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_ui/login.html');
})

router.post('/login', async (req: Request, res: Response) => {
    const { no_telpon, password } = req.body;
    const user = await UserModel.findOne({ no_telpon, password });
    if (user) {
        console.log(user);
        res.status(200).json(user);
        return;
    }
    res.status(400).json('Nomor Telpon atau Password Salah');
})

router.get('/daftar', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_ui/daftar.html');
})

router.post('/daftar', async (req: Request, res: Response) => {
    const { no_telpon, nama, password } = req.body;
    // check the user
    const user = await UserModel.findOne({ no_telpon });
    if (user) {
        res.status(400).json('Nomor Telpon sudah terdaftar');
        return;
    }

    // check the pendaftaran baru
    const pencarian_data = await PendafaranBaruModel.findOne({ no_telpon });
    if (pencarian_data) {
        // delete the pendaftaran baru with no_telpon
        await PendafaranBaruModel.deleteOne({ no_telpon });
    }

    const otp = Math.floor(Math.random() * 1000000);
    // create pendaftaran baru


    // create a 6 otp random otp code

    try {
        const response = await axios.post('http://localhost:3012/send-otp', { number: no_telpon, otp });
        const pendaftaran_baru = new PendafaranBaruModel({ no_telpon, nama, password, otp });
        await pendaftaran_baru.save();
        res.status(200).json('success');
        return;
    } catch (error: any) {
        // console.log(error);
        res.status(error.response.status).json(error.response.data);
        return
    }



    // res.status(400).json('error dari backend');
});

router.post('/verifikasi', async (req: Request, res: Response) => {
    const { no_telpon, kode_otp } = req.body;
    const pencarian_data = await PendafaranBaruModel.findOne({ no_telpon });
    if (!pencarian_data) {
        res.status(400).json('Nomor Telpon tidak ditemukan');
        return;
    }

    if (pencarian_data.otp == kode_otp) {
        const user = new UserModel({ no_telpon, nama: pencarian_data.nama, password: pencarian_data.password });
        await user.save();
        await PendafaranBaruModel.deleteOne({ no_telpon });
        res.status(200).json('success');
        return;
    }
    res.status(400).json('Kode OTP Salah');
    return
})


router.get('/user', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_after_login_ui/index.html');
})


router.get('/user/kirim-paket', async (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_after_login_ui/paket.html');
})

router.post('/user/kirim-paket', async (req: Request, res: Response) => {
    console.log("kirim paket");
    socket_client.emit('scan_dia', 'ini dari kirim-paket');
    res.status(200).json("ini")
})

router.get('/user/kirim-paket1', async (req: Request, res: Response) => {
    console.log("kirim paket");
    socket_client.emit('scan_dia', 'ini dari kirim-paket');
    res.status(200).json("ini")
})


router.post('/user/check', async (req: Request, res: Response) => {
    if (!req.body) {
        res.status(400).json('Bad Request');
        return;
    }
    const { _id, no_telpon, password, createdAt } = req.body;

    // console.log(_id , no_telpon , password , createdAt);
    try {
        // check the user by _id , no_telpon , password , createdAt
        const user = await UserModel.findOne({ _id, no_telpon, password, createdAt });
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


// This should be the last route
router.use((req: Request, res: Response) => {
    res.status(404).sendFile(__dirname + '/user_ui/404.html');
});




export default router;