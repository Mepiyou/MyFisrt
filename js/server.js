const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const port = process.env.PORT || 3000;

// Configuration MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://votre-uri-mongodb';
mongoose.connect(MONGODB_URI);

// Schéma pour les parfums
const parfumSchema = new mongoose.Schema({
    nom: String,
    prixEur: Number,
    tauxConversion: Number,
    prixCfa: Number,
    poids: Number,
    fraisExpedition: Number,
    prixFinal: Number,
    stock: Number,
    image: String
});

const Parfum = mongoose.model('Parfum', parfumSchema);

app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Servir les fichiers statiques du dossier parent

// Route pour lire tous les parfums
app.get('/api/parfums', async (req, res) => {
    try {
        const parfums = await Parfum.find();
        res.json(parfums);
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la lecture des données' });
    }
});

// Route pour mettre à jour les parfums
app.post('/api/parfums', async (req, res) => {
    try {
        const { data } = req.body;
        
        // Supprimer tous les parfums existants
        await Parfum.deleteMany({});
        
        // Ajouter les nouveaux parfums
        const parfums = data.slice(1).map(row => ({
            nom: row[0],
            prixEur: row[1],
            tauxConversion: row[2],
            prixCfa: row[3],
            poids: row[4],
            fraisExpedition: row[5],
            prixFinal: row[6],
            stock: row[7],
            image: row[8]
        }));
        
        await Parfum.insertMany(parfums);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erreur lors de la mise à jour des données' });
    }
});

app.listen(port, () => {
    console.log(`Serveur démarré sur le port ${port}`);
}); 