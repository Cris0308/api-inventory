const express = require('express');
const app = express();
app.use(express.json());

const fs = require('fs');

// Ruta donde se va a crear el archivo temporal
const firebaseKeyPath = './firebaseKey.json';

// Leer la variable de entorno codificada en base64
const firebaseKeyBase64 = process.env.FIREBASE_KEY_BASE64;

// Crear el archivo desde base64 (solo si no existe)
if (firebaseKeyBase64 && !fs.existsSync(firebaseKeyPath)) {
  const decoded = Buffer.from(firebaseKeyBase64, 'base64').toString('utf-8');
  fs.writeFileSync(firebaseKeyPath, decoded);
}

// Ahora sí, ya existe el archivo: podemos importarlo
const admin = require("firebase-admin");
const serviceAccount = require(firebaseKeyPath);

// Inicializamos Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // databaseURL: "..." si aplica
});

// Firestore
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

    if (typeof cantidad !== 'number') {
      return res.status(400).json({ error: 'Cantidad inválida' });
    }

    const docRef = productosCollection.doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await docRef.update({ cantidad });
    res.json({ message: 'Cantidad actualizada correctamente' });
  } catch (error) {
    console.error('Error en PUT /inventory/:id:', error);
    res.status(500).json({ error: 'Error al actualizar la cantidad' });
  }
});


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
    console.error('Error en DELETE /inventory/:id:', error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
});


// Escuchar en el puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
