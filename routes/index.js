import express from 'express';
import restaurantRoutes from './restaurant/restaurantRoutes.js';
import itemRoutes from './item/itemRoutes.js';

const router = express.Router();

router.use('/restaurants', restaurantRoutes);
router.use('/items', itemRoutes);

export default router;
