const products = require('../data/products');

function getAllProducts(req, res) {
  res.json(products);
}

module.exports = { getAllProducts };