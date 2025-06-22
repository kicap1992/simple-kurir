import express from 'express';
import type { Request, Response } from 'express';
import PendafaranBaruModel from '../models/pendaftaran_baru_model';
import UserModel from '../models/user_model';
import KirimanModel from '../models/kiriman_model';
import KurirModel from '../models/kurir_model';
import type { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { socket_client } from '../index';

// import { io, Socket } from 'socket.io-client';


// const socket_client: Socket = io("http://localhost:3014");

const router = express.Router();


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

router.get('/user/gambar/:id/:gambar', (req: Request, res: Response) => {
    const { id, gambar } = req.params;
    // console.log(id, gambar);
    const gambarPath = path.join(__dirname, '../images/user/' + id + '/' + gambar);
    res.sendFile(gambarPath);
})

router.put('/user/:_id', async (req: Request, res: Response) => {
    const { _id } = req.params;
    const { nama, alamat, ada_file } = req.body;
    let gambar_name = "";
    if (ada_file > 0) {
        const { gambar } = req.files as { gambar: UploadedFile };
        // console.log(gambar);
        const userDir = path.join(__dirname, '../images/user/' + _id);
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir);
        }
        // delete all file on userDir
        const files = fs.readdirSync(userDir);
        for (const file of files) {
            fs.unlinkSync(path.join(userDir, file));
        }

        const gambarPath = path.join(userDir, gambar.name);
        gambar_name = gambar.name;
        // console.log(gambarPath);
        await gambar.mv(gambarPath);
    }


    const response = await UserModel.findOneAndUpdate({ _id }, { $set: { nama, alamat, gambar: gambar_name } }, { new: true });
    console.log(response);
    res.status(200).json(response);
})


router.get('/user/kirim-paket', async (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_after_login_ui/paket.html');
})

router.post('/user/kirim-paket', async (req: Request, res: Response) => {
    const { _id, no_telpon_pengirim, nama_pengirim, alamat_pengirim, no_telpon_penerima, nama_penerima, alamat_penerima } = req.body;
    const { gambar_paket } = req.files as { gambar_paket: UploadedFile };

    const userNoTelpon = (await UserModel.findOne({ _id }).select('no_telpon'))?.no_telpon;
    // console.log(userNoTelpon);

    const newKiriman = new KirimanModel({ id_pengirim: _id, no_telpon_pengirim, nama_pengirim, alamat_pengirim, no_telpon_penerima, nama_penerima, alamat_penerima, gambar_paket: gambar_paket.name });
    await newKiriman.save();
    // console.log(newKiriman);

    const gambarPath = path.join(__dirname, '../images/kiriman/' + newKiriman._id + '/' + gambar_paket.name);
    await gambar_paket.mv(gambarPath);

    const message = `Pengiriman anda dengan nomor resi ${newKiriman._id} sedang diproses oleh admin.`;

    try {
        await axios.post('http://localhost:3012/send-message', { number: userNoTelpon, message: message });
    } catch (error) {
        console.log(error);
    }

    socket_client.emit('pengiriman_baru_server');

    res.status(200).json("ini kirim paket")
})

router.get("/user/paket/:id/:status", async (req: Request, res: Response) => {
    try {
        const { id, status } = req.params;
        console.log(id);
        let response
        if (status == "paket") {
            // check where status is not "Dibatalkan Oleh Admin"
            response = await KirimanModel.find({
                id_pengirim: id,
                status: {
                    $nin: ['Dibatalkan Oleh Admin', 'Diterima Terverifikasi',"Dibatalkan Oleh Pengirim"],
                    $type: 'string'
                }
            });
        } else {
            response = await KirimanModel.find({ id_pengirim: id });
        }
        console.log(response);
        res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(400).json([]);
    }

})

router.get("/user/paket-detail/:id", async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(id);
    try {
        const response = await KirimanModel.findOne({ _id: id }).lean();
        if (!response) {
            res.status(404).json("Data tidak ditemukan");
            return;
        }
        let responseWithKurir = {};
        if (response.id_kurir) {
            const kurirData = await KurirModel.findOne({ _id: response.id_kurir });


            responseWithKurir = {
                ...response,
                nama_kurir: kurirData?.nama,
                no_telpon_kurir: kurirData?.no_telpon
            };
            console.log(responseWithKurir);
        }
        // await 2 sec
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        res.status(200).json(response.id_kurir ? responseWithKurir : response);
    } catch (error) {
        console.log(error);
        res.status(400).json("error menampilkan data");
    }
})


router.get("/user/paket-detail/:id/:gambar", async (req: Request, res: Response) => {
    let { id, gambar } = req.params;
    // console.log(id , gambar);
    try {
        const response = await KirimanModel.findOne({ _id: id, gambar_paket: gambar });
        const gambarPath = path.join(__dirname, '../images/kiriman/' + id + '/' + gambar);
        res.sendFile(gambarPath);
        // await 2 sec
        // await new Promise((resolve) => setTimeout(resolve, 2000));
        // res.status(200).json(response);
    } catch (error) {
        console.log(error);
        res.status(400).json("error menampilkan data");
    }
    // res.status(200).json("success");

})



router.get('/user/profil', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_after_login_ui/profil.html');
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

router.get('/user/cek-kurir/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    console.log(id);

    if (!id) {
        res.status(400).json('Bad Request');
        return;
    }
    // res.status(200).json('Success');
    try {
        const kurir = await KurirModel.findOne({ _id: id });
        // console.log(kurir);
        if (!kurir) {
            res.status(400).json('Kurir not found');
            return;
        }
        res.status(200).json(kurir);
        return;
    } catch (error) {
        console.log(error);
        res.status(500).json('Terjadi Kesalahan Server');
        return
    }
})


router.get('/user/kurir/gambar/:no_telpon/:jenis', (req: Request, res: Response) => {
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

router.post('/user/terima-paket/:id_kiriman', async (req: Request, res: Response) => {
    const { id_kiriman } = req.params;
    const { id_pengirim } = req.body;
    console.log(id_kiriman, id_pengirim);

    if (!id_kiriman || !id_pengirim) {
        res.status(400).json('Bad Request');
        return;
    }

    // cek the kiriman by id : id_kiriman , id_pengirim : id_pengirim
    const kiriman = await KirimanModel.findOne({ _id: id_kiriman, id_pengirim });
    if (!kiriman) {
        res.status(400).json('Kiriman not found');
        return;
    }

    try {
        const updatedDoc = await KirimanModel.findOneAndUpdate({ _id: id_kiriman }, {
            $set: {
                status: 'Diterima Terverifikasi'
            },
            $push: {
                timeline: {
                    status: 'Diterima Terverifikasi',
                    waktu: new Date(),
                    // alasan: alasan || null,
                    id_kurir: kiriman.id_kurir
                }
            }
        }, { new: true });
        console.log(updatedDoc, "diterima terverifikasi");
        socket_client.emit('diterima_terverifikasi', updatedDoc);
        res.status(200).json('Success');
    } catch (error) {
        console.log(error);
        res.status(500).json('Terjadi Kesalahan Server');
    }



})

router.delete('/user/delete-paket/:id_kiriman', async (req: Request, res: Response) => {
    const { id_kiriman } = req.params;
    const { id_pengirim } = req.body;

    if (!id_kiriman || !id_pengirim) {
        res.status(400).json('Bad Request');
        return;
    }

    // search by id : id_kiriman , id_pengirim : id_pengirim
    const kirimanData =  await KirimanModel.findOne({ _id: id_kiriman, id_pengirim });
    if (!kirimanData) {
        res.status(400).json('Kiriman not found');
        return;
    }

    try {
        // delete the kiriman
        const deletedDoc = await KirimanModel.findOneAndUpdate({ _id: id_kiriman }, {
            $set: {
                status: 'Dibatalkan Oleh Pengirim'
            },
            $push: {
                timeline: {
                    status: 'Dibatalkan Oleh Pengirim',
                    waktu: new Date(),
                    // alasan: alasan || null,
                    id_kurir: kirimanData.id_kurir
                }
            }
        }, { new: true });
        socket_client.emit('delete_kiriman', deletedDoc);
        res.status(200).json('Success');
    } catch (error) {
        console.log(error);
        res.status(500).json('Terjadi Kesalahan Server');
    }
})


router.get('/user/history', async (req: Request, res: Response) => {
    res.sendFile(__dirname + '/user_after_login_ui/history.html');
})    
// This should be the last route
router.use((req: Request, res: Response) => {
    res.status(404).sendFile(__dirname + '/user_ui/404.html');
});




export default router;