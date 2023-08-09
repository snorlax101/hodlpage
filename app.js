require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const https = require('https');
const cors = require('cors');
const path = require('path');

const app = express();
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

const mongoURI = process.env.mongoURI_connection;

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

const cryptoSchema = new mongoose.Schema({
  name: String,
  last: Number,
  buy: Number,
  sell: Number,
  volume: Number,
  base_unit: String
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

app.get('/api/cryptos', async (req, res) => {
  try {
    // Clear existing data
    await Crypto.deleteMany({});
    console.log('Existing data cleared.');

    // Fetch data from WazirX
    https.get('https://api.wazirx.com/api/v2/tickers', async (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', async () => {
        const tickers = JSON.parse(data);
        const top10Tickers = Object.values(tickers).slice(0, 10);

        for (const ticker of top10Tickers) {
          const { base_unit, last, buy, sell, volume } = ticker;
          const crypto = new Crypto({
            name: base_unit.toUpperCase(),
            last,
            buy,
            sell,
            volume,
            base_unit
          });

          console.log('Saving data:', crypto);
          try {
            await crypto.save();
            console.log('Data saved:', crypto);
          } catch (saveError) {
            console.error('Error saving data:', saveError);
          }
        }

        console.log('Data stored in MongoDB.');
      });
    });

    setTimeout(async () => {
      const cryptos_res = await Crypto.find({}, '-_id name last buy sell volume').limit(10);
      console.log('Retrieved data:', cryptos_res);
      res.json(cryptos_res);
    }, 2000);
  } 
  catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});



const PORT = process.env.PORT; 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
