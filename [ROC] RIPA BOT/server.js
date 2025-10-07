const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// 1. Configurar EJS (Sabemos que esto funciona)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 2. Crear la ruta principal que lee el archivo y muestra la página
app.get('/', (req, res) => {
    const dbPath = path.join(__dirname, 'db.json');
    let warnings = [];

    try {
        if (fs.existsSync(dbPath)) {
            const fileData = fs.readFileSync(dbPath, 'utf8');
            if (fileData) {
                warnings = JSON.parse(fileData);
            }
        }
    } catch (error) {
        console.error("Error al leer la base de datos:", error);
        // Si hay un error, podemos mostrar un mensaje en la página
        return res.status(500).send("Error al leer el archivo de la base de datos.");
    }

    // Invertimos el array para mostrar los warnings más recientes primero
    warnings.reverse();

    // Renderizamos la plantilla 'index.ejs' y le pasamos los datos
    res.render('index', { warnings: warnings });
});

// 3. Iniciar el servidor (Sabemos que esto funciona)
app.listen(port, () => {
    console.log(`🚀 Servidor web iniciado en http://localhost:${port}`);
});