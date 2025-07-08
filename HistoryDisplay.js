import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 4040;
const SMB_URL = "WhoAsked"
const url = "?/market/search/render/?query"
const cdn = "?/economy/image/"
var now = Date.now();

app.set('view engine', 'ejs');
app.set('views', path.resolve() + '/views');

var priceHistory = {}
var priceHistoryLatest = {}

fs.readFile('PriceHistory.json', 'utf8', function readFileCallback(err, data) {
    if (err) {
        console.log("Fatal error reading price history")
        console.log(err);
    } else {
        priceHistory = JSON.parse(data);
    }
});

app.get('/', (req, res) => {
    var oldPrices = {}

    fs.readFile(SMB_URL + 'PriceHistory.json', 'utf8', function readFileCallback(err, data) {
        if (err) {
            console.log("Fatal error reading price history")
            console.log(err);
            return res.send("Fatal error reading price history")
        } else {
            oldPrices = JSON.parse(data);

            if(Object.keys(priceHistoryLatest).length !== 0) {
                var itemsToDelete = {}

                Object.keys(oldPrices).forEach(function (ItemName) {
                    if (!priceHistoryLatest[ItemName]) {
                        itemsToDelete[ItemName] = true;
                    }
                });
    
                Object.keys(itemsToDelete).forEach(function (ItemName) {
                    console.log("Deleting " + ItemName + " as it no longer exists.")
                    delete oldPrices[ItemName];
                });
            }

            return res.render('index', {
                priceHistory: oldPrices
            });
        }
    });
});

app.get('/alltime', (req, res) => {
    return res.render('index', {
        priceHistory: priceHistory
    });
});

app.get('/latest', (req, res) => {
    if (Object.keys(priceHistoryLatest).length === 0) {
        console.log("No latest prices")

        var tempLatest = {}
        Object.keys(priceHistory).forEach(function (ItemName) {
            if (Object.keys(priceHistory[ItemName].history).length > 1) {
                tempLatest[ItemName] = {
                    history: [
                        priceHistory[ItemName].history[0],
                        priceHistory[ItemName].history[Object.keys(priceHistory[ItemName].history).length - 1]
                    ],
                    image: priceHistory[ItemName].image
                };
            } else {
                tempLatest[ItemName] = {
                    history: [
                        priceHistory[ItemName].history[Object.keys(priceHistory[ItemName].history).length - 1]
                    ],
                    image: priceHistory[ItemName].image
                };
            }
        });
        console.log(tempLatest)
        return res.render('index', {
            priceHistory: tempLatest
        });
    } else {
        console.log("Latest prices")
        console.log(priceHistoryLatest.length)
        return res.render('index', {
            priceHistory: priceHistoryLatest
        });
    }
});


app.get('/refresh', (req, res) => {
    now = Date.now();
    console.log("Refreshing!")
    priceHistoryLatest = {}
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Request failed');
            }
            console.log("Fetched")

            var data = response.json().then(data => {
                console.log(data)

                if (data.success !== true) {
                    return res.send("Failed to fetch latest prices")
                }

                for (var i = 0; i < data.results.length; i++) {
                    var item = data.results[i];
                    var name = item.name;
                    var price = item.sell_price_text;
                    var image = cdn + item.asset_description.icon_url;

                    priceHistoryLatest[name] = { history: [], image: image };
                    priceHistoryLatest[name].history.push({
                        price: price, time: new Date().toLocaleString('en-US', {
                            timeZone: 'America/Los_Angeles'
                        })
                    });

                    if (priceHistory[name] == undefined) {
                        priceHistory[name] = { history: [], image: image };
                        priceHistory[name].history.push({
                            price: price, time: new Date().toLocaleString('en-US', {
                                timeZone: 'America/Los_Angeles'
                            })
                        });
                    } else {
                        priceHistory[name].history.push({
                            price: price, time: new Date().toLocaleString('en-US', {
                                timeZone: 'America/Los_Angeles'
                            })
                        });
                    }
                }


                try {
                    fs.writeFile('PriceHistory.json', JSON.stringify(priceHistory), err => {
                        if (err) {
                            console.error(err)
                        } else {
                            console.log("Successfully updated history to file")
                        }
                    });
                } catch (e) {
                    console.log(e)
                }

                return res.send(JSON.stringify(priceHistory));
            });

        }).catch(error => {
            console.error(error);
            res.status(500).send('An error occurred');
        });

    return true;
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
