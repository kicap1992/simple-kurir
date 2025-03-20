// index.ts
import express, { type Request, type Response } from 'express';
import formData from 'express-form-data';
import fileUpload from 'express-fileupload';
import  {testDatabaseConnection} from './connection';
import path from 'path';
import adminRouter from './routes/admin_router';


// this is for dotenv
import { config } from 'dotenv';
config();
console.log("diatas untuk dotenv");




const app = express();
const port = process.env.PORT || 3011;



// Serve static files from the 'assets' directory
app.use('/assets', express.static(path.join(__dirname, '../assets')));

// Middleware for express-form-data
app.use(formData.parse());

app.use(fileUpload({
    createParentPath: true, // Creates the parent directory if it doesn't exist
}));

testDatabaseConnection();

// create an admin route  
app.use('/admin', adminRouter);

app.post('/submit', (req: Request, res: Response) => {
    console.log('Received form data:', req.body);
    res.json({ message: 'Form data received!', data: req.body });
});

app.get('/', (req: Request, res: Response) => {
    res.send("Express and express-form-data test");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});