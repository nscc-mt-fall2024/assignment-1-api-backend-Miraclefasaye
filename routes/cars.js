import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// multers setup for handling image uploads
const storage = multer.diskStorage({
  // Sets the destination for uploaded files
  destination: function (req, file, cb) {
    cb(null, 'public/images/');  
  },
  // renames the uploaded file to a unique name
  filename: function (req, file, cb) {
    const ext = file.originalname.split('.').pop(); 
    const uniqueFilename = Date.now() + '-' + Math.round(Math.random() * 1000) + '.' + ext; 
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage: storage });

// prisma setup for database interaction
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Route to get all cars
router.get('/all', async (req, res) => { 
  const cars = await prisma.car.findMany(); // Fetches all car records from the database
  res.json(cars); // Responds with the array of car records
});

// route to get a car by its ID
router.get('/read/:id', async (req, res) => {
  const id = req.params.id;

  // Validates if the ID is a number
  if (isNaN(id)) {
    return res.status(400).send('Invalid car id.');
  }

  const car = await prisma.car.findUnique({
    where: {
      id: parseInt(id), // Looks for a car with the given ID
    },
  });

  // Responds with the car details or a not found message
  if (car) {
    res.json(car);
  } else {
    res.status(404).send('Car not found.');
  }  
});

// Route to add a new car
router.post('/create', upload.single('image'), async (req, res) => {
  const { name, brand, model, year, price, description } = req.body;  
  const filename = req.file ? req.file.filename : null; // Get the uploaded image filename

  // Check for required fields
  if (!name || !brand || !model || !year || !price) {
    return res.status(400).send('Required fields must have a value.');
  }

  // creates a new car record in the database
  const car = await prisma.car.create({
    data: {
      name: name,
      brand: brand,
      model: model,
      year: parseInt(year), 
      description: description || '', 
      price: parseFloat(price), // Convert price to a float
      imageName: filename, // Save the filename of the uploaded image
    }
  });

  res.json(car); // responds with the created car details
});

// Route to update a car by ID
router.put('/update/:id', upload.single('image'), async (req, res) => {
  const id = req.params.id;
  const { name, brand, model, year, price, description } = req.body;

  // Validates if the ID is a number
  if (isNaN(id)) {
    return res.status(400).send('Invalid car id.');
  }

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) } // Fetch the car to update
  });

  // If the car doesn't exist, respond with a not found message
  if (!car) {
    return res.status(404).send('Car not found.');
  }

  // Prepare updated data, keeping existing values if not provided
  const updatedData = {
    name: name || car.name,
    brand: brand || car.brand,
    model: model || car.model,
    year: year ? parseInt(year) : car.year,
    price: price ? parseFloat(price) : car.price,
    description: description || car.description,
    imageName: req.file ? req.file.filename : car.imageName,
  };

  // If a new image is uploaded, delete the old image file
  if (req.file && car.imageName) {
    const oldImagePath = path.join(__dirname, '..', 'public', 'images', car.imageName);
    fs.unlink(oldImagePath, (err) => {
      if (err) console.error('Failed to delete old image:', err);
    });
  }

  // Update the car record in the database
  const updatedCar = await prisma.car.update({
    where: { id: parseInt(id) },
    data: updatedData
  });

  res.json(updatedCar); // Respond with the updated car details
});

// Route to delete a car by ID
router.delete('/delete/:id', async (req, res) => {
  const id = req.params.id;

  // Validate if the ID is a number
  if (isNaN(id)) {
    return res.status(400).send('Invalid car id.');
  }

  const car = await prisma.car.findUnique({
    where: { id: parseInt(id) } // Fetch the car to delete
  });

  // If the car doesn't exist, respond with a not found message
  if (!car) {
    return res.status(404).send('Car not found.');
  }

  // delete the car record from the database
  await prisma.car.delete({
    where: { id: parseInt(id) }
  });

  // if the car has an associated image, delete the image file
  if (car.imageName) {
    const imagePath = path.join(__dirname, '..', 'public', 'images', car.imageName);
    fs.unlink(imagePath, (err) => {
      if (err) console.error('Failed to delete image:', err);
    });
  }

  res.send('Car deleted successfully.'); // responds with a success message
});

export default router;
// END OF CODE, see you in class teach