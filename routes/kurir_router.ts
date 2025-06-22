import express from 'express';
import type { Request, Response } from 'express';
import PendafaranBaruModel from '../models/pendaftaran_baru_model';
import KurirModel from '../models/kurir_model';
import type { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import UserModel from '../models/user_model';
import KirimanModel from '../models/kiriman_model';
import axios from 'axios';
import { socket_client } from '../index';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/kurir_ui/index.html');
});

router.get('/penghantaran', (req: Request, res: Response) => {
    res.sendFile(__dirname + '/kurir_ui/penghantaran.html');
})

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
        console.log("error di kurir login", error);
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

router.get('/gambar-paket/:id/:gambar', (req: Request, res: Response) => {
    const { id, gambar } = req.params;
    const imagePath = path.join(__dirname, `../images/kiriman/${id}/${gambar}`);

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
    console.log(_id, no_telpon, password, createdAt);

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

router.get('/paket/:id/:status', async (req: Request, res: Response) => {
    const { id, status } = req.params;
    try {
        const kirimanDoc = status == "ongoing" ? await KirimanModel.find({
            id_kurir: id,
            status: {
                $nin: ['Dibatalkan Oleh Admin', 'Paket Telah Diterima Penerima',"Diterima Terverifikasi"],
                $type: 'string'
            }
        }) : await KirimanModel.find({ id_kurir: id });
        console.log(kirimanDoc);
        res.status(200).json(kirimanDoc);
    } catch (error) {
        console.log(error);
        res.status(500).json([]);
    }
})

router.get('/user/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        const user = await UserModel.findOne({ _id: id });
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
        res.status(500).json();
    }

})

router.delete('/batalkan-pengiriman/:id_kurir', async (req: Request, res: Response) => {
    const { id_kurir } = req.params;
    const { id, alasan } = req.body;
    // console.log(id_kurir , id , alasan);

    try {
        const updatedDoc = await KirimanModel.findByIdAndUpdate(
            id,
            {
                $set: {
                    status: 'Dibatalkan Oleh Kurir , Admin mencari kurir baru',
                    id_kurir: null
                },
                $push: {
                    timeline: {
                        status: 'Dibatalkan Oleh Kurir , Admin mencari kurir baru',
                        waktu: new Date(),
                        alasan: alasan || null,
                        id_kurir
                    }
                }
            },
            { new: true } // Return the updated document

        );

        await KurirModel.findByIdAndUpdate(
            id_kurir,
            {
                $set: {
                    status: 'Tersedia'
                }
            },
            { new: true } // Return the updated document
        )
        // console.log(updatedDoc);
        const userData = await UserModel.findById(updatedDoc?.id_pengirim);
        // const kurirData = await KurirModel.findById(id_kurir);

        socket_client.emit('pembatalan_paket_kurir', updatedDoc);

        try {
            await axios.post('http://localhost:3012/send-message', { number: userData?.no_telpon, message: `🛵*_Kurir Shenior 🛵_*\nPengiriman anda dengan nomor resi ${updatedDoc?._id} telah dibatalkan oleh kurir\nAdmin akan menugaskan kurir yang baru\nHarap Bersabar'}* 🔄🔄` })
        } catch (error) {
            console.log(error)
        }

    } catch (error) {
        console.log(error)
        res.status(500).json();
    }


})


// kurir menyetujui pengambilan pengiriman
router.put('/mengambil-pengiriman/:id', async (req: Request, res: Response) => {
    const { id: id_kiriman } = req.params;
    const { id_kurir } = req.body;
    console.log(id_kiriman, id_kurir);

    // sini nnt berlaku update data
    // const kirimanData = await KirimanModel.findById(id_kiriman);
    const kirimanDoc = await KirimanModel.findByIdAndUpdate(
        id_kiriman,
        {
            $set: {
                id_kurir: id_kurir,
                status: 'Kurir Dalam Perjalanan',
            },
            $push: {
                timeline: {
                    status: 'Kurir Dalam Perjalanan',
                    waktu: new Date(),
                    alasan: null,
                    id_kurir
                }
            }
        },
        { new: true } // Return the updated document
    );

    const userData = await UserModel.findById(kirimanDoc?.id_pengirim);
    const kurirData = await KurirModel.findById(id_kurir);


    try {
        await axios.post('http://localhost:3012/send-message', { number: userData?.no_telpon, message: `🛵*_Kurir Shenior_* 🛵 \nPengiriman anda dengan nomor resi *${id_kiriman}* telash disetujui oleh kurir.\n Kurir sekarang berangkat ke alamat pengirim untuk mengambil paket, Silakan menunggu} ➡️➡️` })
        await axios.post('http://localhost:3012/send-message', { number: kurirData?.no_telpon, message: `🛵*_Kurir Shenior_* 🛵 \nAnda telah ditugaskan untuk mengambil paket dengan nomor resi *${id_kiriman}* \nAlamat Pengirim : *${kirimanDoc?.alamat_pengirim}* \nNama Pengirim: *${kirimanDoc?.nama_pengirim}*` })
    } catch (error) {
        console.log("Error Mengambil Pengiriman | Kurir");
        console.log(error);
    }



    // notifikasi ke aplikasi (admin dan user)
    socket_client.emit('kurir_mengambil_pengiriman', kirimanDoc);


    res.status(200).json("ini mengambil pengiriman");

})

router.post('/mengambil-pengiriman-dari-pengirim-ke-penerima/:id', async (req: Request, res: Response) => {
    const { id: id_kiriman } = req.params;
    const { id_kurir, status } = req.body;

    const { foto_paket } = req.files as {
        foto_paket: UploadedFile;

    };

    // console.log(id_kiriman, id_kurir);
    // console.log(foto_paket);

    const random_5_char = Math.random().toString(36).substring(2, 7);
    const nama_foto = `${random_5_char}-${foto_paket.name}`;

    const paketDir = path.join(__dirname, `../images/kiriman/${id_kiriman}`);
    const paketPath = path.join(paketDir, `${nama_foto}`);

    console.log(paketPath);
    fs.mkdirSync(paketDir, { recursive: true });

    // move photo
    await foto_paket.mv(paketPath);


    // const kirimanDoc = await KirimanModel.findById(id_kiriman);
    const kirimanDoc = await KirimanModel.findByIdAndUpdate(
        id_kiriman,
        {
            $set: {
                id_kurir: id_kurir,
                status: status == "mengirim" ? 'Mengirim Paket Ke Alamat Penerima' : 'Paket Telah Diterima Penerima',
            },
            $push: {
                timeline: {
                    status: status == "mengirim" ? 'Mengirim Paket Ke Alamat Penerima' : 'Paket Telah Diterima Penerima',
                    waktu: new Date(),
                    alasan: null,
                    id_kurir,
                    gambar: nama_foto
                }
            }
        },
        { new: true } // Return the updated document
    );


    const userData = await UserModel.findById(kirimanDoc?.id_pengirim);
    // const kurirData = await KurirModel.findById(id_kurir);
    if (status == "menerima") {
        await KurirModel.findByIdAndUpdate(
            id_kurir,
            {
                $set: {
                    status: 'Tersedia'
                }
            }
        )
    }


    // console.log(kirimanDoc);
    // console.log(userData);
    // console.log(kurirData);

    try {
        const mes = status == "mengirim" ? `🛵*_Kurir Shenior_* 🛵 \nPengiriman anda dengan nomor resi *${id_kiriman}* telah diambil oleh kurir.\nSilakan menunggu kurir mengantarkan paket ke alamat penerima di *${kirimanDoc?.alamat_penerima}*` : `🛵*_Kurir Shenior_* 🛵 \nPengiriman anda dengan nomor resi *${id_kiriman}* telah diterima oleh penerima.`
        await axios.post('http://localhost:3012/send-message', { number: userData?.no_telpon, message: mes, img_stat: true, foto_paket: paketPath, foto_name: foto_paket.name })
        // await axios.post('http://localhost:3012/send-message', { number: kurirData?.no_telpon, message: `🛵*_Kurir Shenior_* 🛵 \nAnda telah mengambil paket dengan nomor resi *${id_kiriman}* di alamat pengirim dan akan menghantar ke \nAlamat Penerima : *${kirimanDoc?.alamat_penerima}* \nNama Penerima: *${kirimanDoc?.nama_penerima}*` ,img_stat:true , foto_paket : paketPath, foto_name : foto_paket.name})
    } catch (error) {
        console.log("Error Mengambil Pengiriman di pengirim | Kurir");
        console.log(error);
    }

    socket_client.emit('kurir_menghantar_ke_penerima', kirimanDoc);

    res.status(200).json("sukses");
})

// log penghantaran menu
router.get('/log', async (req: Request, res: Response) => {
    res.sendFile(__dirname + '/kurir_ui/log.html');
})

export default router;