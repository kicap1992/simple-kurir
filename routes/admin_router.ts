// create admin router
import express from 'express';
import type { Request, Response } from 'express';
const router = express.Router();

router.get('/', (req: Request, res: Response) => {
    res.send('Admin Home');
});

export default router;