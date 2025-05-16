import { create, Whatsapp } from 'venom-bot';
import express, { type Request, type Response } from 'express';

let client: Whatsapp;

async function initBot() {
  try {
    client = await create({
      session: 'kurir-bot',
      headless: 'new',
      browserArgs: ['--no-sandbox'],
    });

    console.log('WhatsApp bot connected');

    client.onMessage(async (message) => {
      if (message.body === 'hi' && !message.isGroupMsg) {
        await client.sendText(message.from, 'Hello! 👋');
      }
    });

    // Start the HTTP server after bot is ready
    startServer();
  } catch (err) {
    console.error('Failed to initialize bot:', err);
  }
}

function startServer() {
  const app = express();
  app.use(express.json());

  app.post('/send-otp', async (req: Request, res: Response) => {
    let { number, otp } = req.body;
    
    // remove the 0 in front of the number
    if (number.startsWith('0')) {
      number = number.slice(1);
    }
    // add +62 to the number
    number = `+62${number}`;
    // convert to int
    number = parseInt(number);
    console.log(`Sending OTP ${otp} to ${number}`);

    const formattedNumber = `${number}@c.us`;

    try {
      await client.sendText(formattedNumber, `Kode OTP Anda: ${otp}`);
      console.log(`OTP ${otp} sent to ${number}`);
      res.status(200).json({ success: true });
    } catch (error) {
      // console.error(error);
      if (
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        'text' in error
      ) {
        const err = error as { status: number; text: string };
        console.log(err.status);
        console.log(err.text);
        const text_response = err.status == 404 ? 'Nomor Telpon Tidak Terdaftar Pada Whatsapp<br />Silahkan Periksa Nomor Telpon Anda' : err.text
        res.status(err.status).json(text_response);
        return;
      }
      res.status(500).json({ error: 'Failed to send OTP.' });
    }
  });

  const PORT = 3012;
  app.listen(PORT, () => {
    console.log(`WhatsApp bot API listening on http://localhost:${PORT}`);
  });
}

initBot();
