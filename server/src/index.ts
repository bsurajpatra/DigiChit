import mongoose from 'mongoose';
import app from './app.js';
import { config } from './config/env.js';

const { port, mongoUri } = config;

mongoose
    .connect(mongoUri)
    .then(() => {
        console.log('Connected to MongoDB');
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
