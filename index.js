const express = require('express');
const app = express();
app.use(express.json());

const fs = require('fs');
const firebaseKeyPath = './firebaseKey.json';
const firebaseKeyBase64 = process.env.FIREBASE_KEY_BASE64;

if (firebaseKeyBase64 && !fs.existsSync(firebaseKeyPath)) {
  const decoded = Buffer.from(firebaseKeyBase64, 'base64').toString('utf-8');
  fs.writeFileSync(firebaseKeyPath, decoded);
}

const admin = require("firebase-admin");
const serviceAccount = require(firebaseKeyPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const productosCollection = db.collection('productos');

// Rutas

app.get('/', (req, res) => {
  res.send('API Inventory está funcionando');
});

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
    console.log('📦 Producto recibido:', nuevoProducto);

    // Firestore generará automáticamente un ID
    const docRef = await productosCollection.add(nuevoProducto);

    console.log('✅ Producto agregado correctamente con ID:', docRef.id);
    res.status(201).json({ message: 'Producto agregado correctamente', id: docRef.id, ...nuevoProducto });
  } catch (error) {
    console.error('🔥 Error al agregar producto:', error);
    res.status(500).json({ error: 'Error al agregar el producto' });
  }
});



// PUT: Actualizar cantidad usando el ID personalizado
app.put('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const docRef = productosCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await docRef.update({ cantidad });
    res.json({ message: 'Cantidad actualizada correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la cantidad' });
  }
});

// DELETE: Eliminar producto por ID personalizado
app.delete('/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const docRef = productosCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await docRef.delete();
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});

// Escuchar en el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
