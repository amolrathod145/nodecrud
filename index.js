const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

const app = express();
const jsonFilePath = path.join(__dirname, 'products.json');

// Middleware to parse JSON
app.use(express.json());

// Multer configuration to handle file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage });

// API to insert products and save product image in Public directory
app.post('/products', upload.single('image'), (req, res) => {
  const { productId, productName, productDescription, isActive } = req.body;
  console.log(req.file)
  const imagePath = req.file ? `/images/${req.file.filename}` : '';

  const product = {
    productId,
    productName,
    productDescription,
    isActive,
    imagePath,
  };

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read products file.' });
    }

    let products = [];
    if (data) {
      products = JSON.parse(data);
    }

    products.push(product);

    fs.writeFile(jsonFilePath, JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to write products file.' });
      }

      res.json(product);
    });
  });
});

// API to get product information by productId
app.get('/products/:productId', (req, res) => {
  const productId = req.params.productId;

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read products file.' });
    }

    const products = JSON.parse(data);
    const product = products.find((p) => p.productId === productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    res.json(product);
  });
});

// API to get a list of active products available in the collection (Max 10 per page)
app.get('/products', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read products file.' });
    }

    const products = JSON.parse(data);
    const activeProducts = products.filter((p) => p.isActive === true);
    const paginatedProducts = activeProducts.slice(offset, offset + limit);

    res.json(paginatedProducts);
  });
});

// API to update the product by productId
app.put('/products/:productId', (req, res) => {
  const productId = req.params.productId;

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read products file.' });
    }

    let products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.productId === productId);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const updatedProduct = { ...products[productIndex], ...req.body };
    products[productIndex] = updatedProduct;

    fs.writeFile(jsonFilePath, JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to write products file.' });
      }

      res.json(updatedProduct);
    });
  });
});

// API to delete a product by productId
app.delete('/products/:productId', (req, res) => {
  const productId = req.params.productId;

  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to read products file.' });
    }

    let products = JSON.parse(data);
    const productIndex = products.findIndex((p) => p.productId === productId);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const deletedProduct = products.splice(productIndex, 1)[0];

    fs.writeFile(jsonFilePath, JSON.stringify(products), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to write products file.' });
      }

      res.json(deletedProduct);
    });
  });
});

// Start the server
app.listen(5000, () => {
  console.log('Server started on port 5000');
});
