const express = require('express');
const admin = require('firebase-admin');
require('dotenv').config();

// Construye el objeto desde variables individuales
const serviceAccount = {
  type: process.env.FB_TYPE,
  project_id: process.env.FB_PROJECT_ID,
  private_key_id: process.env.FB_PRIVATE_KEY_ID,
  private_key: process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n'), // 🔥 Importante
  client_email: process.env.FB_CLIENT_EMAIL,
  client_id: process.env.FB_CLIENT_ID,
  auth_uri: process.env.FB_AUTH_URI,
  token_uri: process.env.FB_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FB_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FB_CLIENT_CERT_URL,
};

// Inicializa Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FB_PROJECT_ID
});

const db = admin.firestore();

// Express setup
const app = express();
app.use(express.json());

const productosCollection = db.collection('productos');

app.get('/inventory', async (req, res) => {
  try {
    const snapshot = await productosCollection.get();
    const productos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

app.post('/inventory', async (req, res) => {
  try {
    const nuevoProducto = req.body;
    const docRef = await productosCollection.add(nuevoProducto);
    res.status(201).json({ id: docRef.id, ...nuevoProducto });
  } catch (error) {
    res.status(500).json({ error: 'Error al agregar el producto' });
  }
});

app.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    await productosCollection.doc(id).update({ cantidad });
    res.json({ message: 'Cantidad actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cantidad' });
  }
});

app.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await productosCollection.doc(id).delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
