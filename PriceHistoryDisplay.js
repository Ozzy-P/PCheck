import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 4040;
const SMB_URL = `//192.168.1.1/${process.env.USER}/`

app.set('view engine', 'ejs');
app.set('views', path.resolve() + '/views');

app.get('/', (req, res) => {
    var priceHistory = {}

    fs.readFile(SMB_URL + 'PriceHistory.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log("Fatal error reading price history")
            console.log(err);
            return res.send("Fatal error reading price history")
        } else {
            priceHistory = JSON.parse(data);
            return res.render('index', {
                priceHistory: priceHistory
            });
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});