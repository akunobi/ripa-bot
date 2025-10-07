const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
// --- ESTA ES LA LÍNEA MÁGICA ---
// Le dice al servidor: "Usa el puerto que Render te dé en la variable PORT. Si no te da ninguno (porque estoy en mi PC), usa el 3000".
const port = process.env.PORT || 3000;
const uri = process.env.MONGO_URI;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function getWarnings() {
    const client = new MongoClient(uri);
    let warnings = [];
    try {
        await client.connect();
        const database = client.db("discord_bot");
        const collection = database.collection("warnings");
        warnings = await collection.find({}).sort({ timestamp: -1 }).toArray();
    } finally {
        await client.close();
    }
    return warnings;
}

app.get('/', async (req, res) => {
    try {
        const warnings = await getWarnings();
        res.render('index', { warnings: warnings });
    } catch (error) {
        console.error("Error fetching warnings for web page:", error);
        res.status(500).send("Error connecting to the database.");
    }
});

app.listen(port, () => {
    console.log(`🚀 Web server started on port ${port}`);
});

