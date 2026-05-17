require('dotenv').config()

console.log("File started")

const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const port = process.env.PORT || 3019
const app = express()

app.set('trust proxy', 1)

app.use(
  helmet({
    contentSecurityPolicy: false
  })
)

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const submitItemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: 'Too many submissions from this IP. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})

const apiItemsReadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many requests. Please try again shortly.' })
  }
})

const resolveItemLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many update requests. Please try again later.' })
  }
})

const matchImageLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ matchId: null, error: 'Too many match requests. Please try again later.' })
  }
})

const sendPage = (file) => (req, res) => {
  res.sendFile(path.join(__dirname, file))
}

app.get('/', sendPage('home.html'))
app.get('/index.html', (req, res) => {
  res.redirect(302, '/home.html')
})
app.get('/home.html', sendPage('home.html'))
app.get('/signin.html', sendPage('signin.html'))
app.get('/otpindex.html', sendPage('otpindex.html'))
app.get('/responses.html', sendPage('responses.html'))
app.get('/postitem.html', sendPage('postitem.html'))

app.use(express.static(__dirname))

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lostandfounditems'

mongoose.connect(MONGODB_URI)
const db = mongoose.connection

app.get('/submit-item', (req, res) => {
  res.redirect('/postitem.html')
})

db.once('open', () => {
  console.log("Connected to MongoDB")
})

db.on('error', (err) => {
  console.error("MongoDB connection error:", err)
})


const itemSchema = new mongoose.Schema({

  rollno: {
    type: String,
    required: true
  },

  itemType: {
    type: String,
    enum: ['lost', 'found'],
    required: true
  },

  itemName: {
    type: String,
    required: true
  },

  description: {
    type: String,
    required: true
  },

  dateLost: {
    type: Date,
    required: true
  },

  datePosted: {
    type: Date,
    default: Date.now
  },

  hostelandroomNo: {
    type: String,
    required: true
  },

  contact: {
    type: String,
    required: true
  },

  imageUrl: {
    type: String,
    required: false
  },

  resolved: {
    type: Boolean,
    default: false
  }

}, { timestamps: true })

const Items = mongoose.model('ItemData', itemSchema)


const multer = require('multer')
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed!'), false)
    }
  }
})


const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})


async function uploadToCloudinary(file) {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'lost-and-found',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error)
            reject(error)
          } else {
            console.log('Cloudinary upload success:', result.secure_url)
            resolve(result.secure_url)
          }
        }
      )

      uploadStream.end(file.buffer)
    })
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error)
    throw error
  }
}


app.post('/submit-item', submitItemLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.body.rollno) {
      return res.status(400).send("User not logged in");
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file);
    }

    const item = new Items({
      rollno: req.body.rollno,
      itemType: req.body.itemType,
      itemName: req.body.itemName,
      description: req.body.description,
      dateLost: req.body.dateLost,
      hostelandroomNo: req.body.hostelandroomNo,
      contact: req.body.contact,
      imageUrl
    });

    await item.save();
    res.redirect('/responses.html');
  } catch (err) {
    res.status(500).send(err.message);
  }
});


app.get('/api/items', apiItemsReadLimiter, async (req, res) => {
  try {
    const items = await Items.find().sort({ datePosted: -1 })
    res.json(items)
  } catch (err) {
    console.error('Error fetching items:', err)
    res.status(500).json({ error: 'Error fetching items' })
  }
})


app.patch('/api/items/:id/resolve', resolveItemLimiter, async (req, res) => {
  try {
    const updated = await Items.findByIdAndUpdate(
      req.params.id,
      { resolved: true, itemType: 'found' },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


app.post("/api/match-image", matchImageLimiter, async (req, res) => {
  try {
    const image = req.body.image;
    if (!image) return res.json({ matchId: null });

    const items = await Items.find({ imageUrl: { $ne: null } });

    const aiRes = await fetch("http://127.0.0.1:5001/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        items
      })
    });

    const result = await aiRes.json();
    res.json(result);

  } catch (err) {
    console.error("AI match error:", err);
    res.json({ matchId: null });
  }
});


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).send('File is too large. Maximum size is 10MB.')
    }
    return res.status(400).send(`Upload error: ${err.message}`)
  }

  if (err) {
    console.error('Unhandled error:', err)
    return res.status(500).send(`Server error: ${err.message}`)
  }

  next()
})

app.listen(port, () => {
  console.log(`Server started on port ${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})
