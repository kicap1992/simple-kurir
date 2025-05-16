// ini adalah file utama dari aplikasi ini
import express, { type Request, type Response } from 'express';

import http from 'http';

import * as socket from './socket';
const socket_client = socket.clientSocket;


// import formData from 'express-form-data';
import fileUpload from 'express-fileupload';
import  {testDatabaseConnection} from './connection';
import path from 'path';
import adminRouter from './routes/admin_router';
import userRouter from './routes/user_router';
import kurirRouter from './routes/kurir_router';


// this is for dotenv
import { config } from 'dotenv';
config();
console.log("diatas untuk dotenv");




const app = express();
const port = process.env.PORT || 3011;
const server = http.createServer(app);
const io = socket.init(server);



// Serve static files from the 'assets' directory
app.use(express.static(path.join(__dirname, 'assets')));

// Middleware for express-form-data
// app.use(formData.parse());

app.use(fileUpload({
    createParentPath: true, // Creates the parent directory if it doesn't exist
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




testDatabaseConnection();

// create an admin route  
app.use('/admin', adminRouter);
app.use('/kurir', kurirRouter);
app.use('/', userRouter);

io.on('connection', (socket) => {
    const userID = socket.id;
    // console.log('A user connected: ' + userID);

    socket.on('scan_dia', (data: any) => {
        console.log('Received scan_dia event: ' + data);
        io.emit('scan_dia_lagi', "coba");
        // socket.broadcast.emit('scan_dia_lagi', "coba");
        // // cobadulu();
        //  io.emit('scan_dia_lagi', 'ini coba');
    });

    socket.on('scan_dia_lagi', (data: any) => {
        console.log('Received scan_dia_lagi event: ' + data);
    });

    socket.on('disconnect', () => {
        // console.log('User disconnected: ' + userID);
    });
});


// function cobadulu(){
//     console.log("coba");
//     socket_client.emit('scan_dia_lagi', 'ini coba');
// }



// app.post('/submit', (req: Request, res: Response) => {
//     console.log('Received form data:', req.body);
//     res.json({ message: 'Form data received!', data: req.body });
// });




// app.listen(port, async () => {
//     console.log(`Server is running on port ${port}`);
// });
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

export default { app, server, io };
