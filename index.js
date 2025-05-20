const express = require('express');
const admin = require('firebase-admin');
const serviceAccount = require('./firebaseKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();
app.use(express.json());

const productosCollection = db.collection('productos');

// Aquí comienzan los endpoints:

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
