const express = require('express');
const db = require('./database');
const media = require('./media');
const app = express();

app.use(express.json({limit:'100kb'}));
app.use('/uploads/products',express.static(media.PRODUCTS,{
 dotfiles:'deny',index:false,maxAge:0,fallthrough:false,
 setHeaders:res => res.setHeader('X-Content-Type-Options','nosniff')
}));

const fail = message => { throw Object.assign(new Error(message),{status:400}); };

function mediaPath(value) {
 if (!value) return true;
 if (/^https?:\/\//i.test(value)) {
  try { const u = new URL(value); return !!u.hostname && !u.username && !u.password; }
  catch { return false; }
 }
 return !/[\s\\:]/.test(value) && !value.startsWith('//') && !/^[?#]/.test(value);
}

function validate(body) {
 if (!body || typeof body !== 'object' || Array.isArray(body)) fail('A JSON object is required.');
 const product = {};
 for (const [field,max] of Object.entries({name:100,category:100,image:2048,video:2048,description:1000})) {
  const value = body[field] === undefined ? '' : body[field];
  if (typeof value !== 'string' || value.length > max) fail(`Invalid ${field}.`);
  product[field] = value.trim();
 }
 if (!product.name) fail('Product name is required.');
 if (!db.prepare('SELECT id FROM collections WHERE id=?').get(product.category)) fail('Collection does not exist.');
 product.price = body.price === undefined ? 0 : body.price;
 if (typeof product.price !== 'number' || !Number.isFinite(product.price) || product.price < 0) fail('Price must be a non-negative number.');
 if (!mediaPath(product.image) || !mediaPath(product.video)) fail('Invalid media path.');
 return product;
}

app.get('/api/health',(_,res) => {
 db.prepare('SELECT 1').get();
 res.json({ok:true,message:'Backend and SQLite connected'});
});

app.get('/api/collections',(_,res) => res.json(db.prepare('SELECT * FROM collections ORDER BY name').all()));
app.get('/api/products',(_,res) => res.json(db.prepare('SELECT * FROM products ORDER BY id DESC').all()));

app.param('id',(req,res,next,value) => {
 if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) return res.status(400).json({error:'Invalid product ID.'});
 req.product = db.prepare('SELECT * FROM products WHERE id=?').get(Number(value));
 if (!req.product) return res.status(404).json({error:'Product not found.'});
 if (req.method !== 'GET' && req.method !== 'HEAD' && media.busy(req.product.id)) return res.status(409).json({error:'This product has an upload in progress.'});
 next();
});

app.get('/api/products/:id',(req,res) => res.json(req.product));

app.post('/api/products',(req,res) => {
 const product = validate(req.body);
 const result = db.prepare('INSERT INTO products(name,category,image,video,description,price) VALUES (@name,@category,@image,@video,@description,@price)').run(product);
 const saved = db.prepare('SELECT * FROM products WHERE id=?').get(result.lastInsertRowid);
 res.status(201).location(`/api/products/${saved.id}`).json(saved);
});

app.put('/api/products/:id',(req,res) => {
 const product = validate(req.body);
 db.prepare('UPDATE products SET name=@name,category=@category,image=@image,video=@video,description=@description,price=@price WHERE id=@id').run({...product,id:req.product.id});
 res.json(db.prepare('SELECT * FROM products WHERE id=?').get(req.product.id));
});

app.post('/api/products/:id/image',media.upload(db,'image'));
app.post('/api/products/:id/video',media.upload(db,'video'));

app.delete('/api/products/:id',(req,res) => {
 db.prepare('DELETE FROM products WHERE id=?').run(req.product.id);
 res.json({ok:true,message:'Product deleted.'});
});

app.use((req,res) => res.status(404).json({error:'Endpoint not found.'}));

app.use((error,req,res,next) => {
 if (res.headersSent) return next(error);
 if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({error:'Product name already exists.'});
 if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') return res.status(400).json({error:'Invalid collection.'});
 if (error.type === 'entity.parse.failed') return res.status(400).json({error:'Invalid JSON.'});
 if (error.type === 'entity.too.large') return res.status(413).json({error:'Request body is too large.'});
 if ([400,404,409,413,422].includes(error.status)) return res.status(error.status).json({error:error.status === 404 ? 'Not found.' : error.message});
 console.error(error);
 res.status(500).json({error:'Server error.'});
});

const server = app.listen(3000,'127.0.0.1',() => console.log('Backend: http://127.0.0.1:3000'));
server.requestTimeout = 600000;