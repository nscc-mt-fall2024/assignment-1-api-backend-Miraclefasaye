import express from 'express';
import carsRouter from './routes/cars.js';

const port = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.use('/api/cars', carsRouter);

app.listen(port, () => {
  console.log(`Car API app listening on port ${port}`);
});
