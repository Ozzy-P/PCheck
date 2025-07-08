import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';

const url = "?/?query="
const cdn = "?/economy/image/"
var now = Date.now()

var priceHistory = {}
const app = express();

fs.readFile('PriceHistory.json', 'utf8', function readFileCallback(err, data) {
    if (err) {
        console.log("Fatal error reading price history")
        console.log(err);
    } else {
        priceHistory = JSON.parse(data);
    }
});



app.get('/', (req, res) => {
    console.log("Running")

    if (Date.now() / 1000 - now / 1000 > 15) {
        now = Date.now();
        console.log("Refreshing!")
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
                        if (priceHistory[name] == undefined) {
                            priceHistory[name] = {history: [], image: image};
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
    } else {
        res.send(JSON.stringify(priceHistory));
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
