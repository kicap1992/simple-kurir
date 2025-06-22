// ini adalah file utama dari aplikasi ini
import express, { type Request, type Response } from 'express';


// import cors from 'cors';
import fileUpload from 'express-fileupload';
import  {testDatabaseConnection} from './connection';
import path from 'path';

import { io, Socket } from 'socket.io-client';





const app = express();

import adminRouter from './routes/admin_router';
import userRouter from './routes/user_router';
import kurirRouter from './routes/kurir_router';


// this is for dotenv
import { config } from 'dotenv';
config();
console.log("diatas untuk dotenv");

const socket_client: Socket = io(process.env.socket_server as string);



const port = process.env.PORT || 3011;




// Serve static files from the 'assets' directory
app.use(express.static(path.join(__dirname, 'assets')));

// Middleware for express-form-data
// app.use(formData.parse());

app.use(fileUpload({
    createParentPath: true, // Creates the parent directory if it doesn't exist
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// app.options('*', cors())
// app.use(cors())




testDatabaseConnection();

// create an admin route  
app.use('/admin', adminRouter);
app.use('/kurir', kurirRouter);
app.use('/', userRouter);

export { socket_client }

app.listen(port, async () => {
    console.log(`Server is running on port ${port}`);
});

