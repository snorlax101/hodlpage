// app.js
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
  volume: Number
});

const Crypto = mongoose.model('Crypto', cryptoSchema);

async function clearExistingData() {
    try {
      await Crypto.deleteMany({});
      console.log('Existing data cleared.');
    } catch (error) {
      console.error('Error clearing existing data:', error);
    }
  }

async function fetchDataAndStore() {
  await clearExistingData();
  try {
    https.get('https://api.wazirx.com/api/v2/tickers', (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', async () => {
        const tickers = JSON.parse(data);

        // Extract top 10 tickers
        const top10Tickers = Object.values(tickers).slice(0, 10);
        //console.log(JSON.stringify(top10Tickers));

        // Store data in MongoDB
        for (const ticker of top10Tickers) {
          const { base_unit, last, buy, sell, volume } = ticker;
          const crypto = new Crypto({
            name: base_unit.toUpperCase(),
            last,
            buy,
            sell,
            volume
          });
          console.log('Saving data:', crypto);
          try {
            await crypto.save();
            console.log('Data saved:', crypto);
          } 
          catch (saveError) {
          console.error('Error saving data:', saveError);
          }
        }

        console.log('Data stored in MongoDB.');
      });
    });
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
fetchDataAndStore();

app.get('/api/cryptos', async (req, res) => {
    try {
      const cryptos = await Crypto.find({}, '-_id name last buy sell volume').limit(10);
      res.json(cryptos);
    } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).json({ error: 'Error fetching data' });
    }
  });


const PORT = process.env.PORT; 
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
