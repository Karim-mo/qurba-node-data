import express from 'express';
import asyncHandler from 'express-async-handler';
import { body, query, param } from 'express-validator';
import { FormValidation, Auth, Database } from 'qurba-node-common';

// Grab the necessary schemas
const Restaurant = Database.Schemas.Restaurant;

// Assign a reference to avoid using the long name every time
const validate = FormValidation.validate;
const auth = Auth.UserAuth_JWT;

const router = express.Router();

const addItem = asyncHandler(async (req, res) => {
	const { restaurantID, name, image, description } = req.body;

	const restaurant = await Restaurant.findById({ _id: restaurantID });

	if (restaurant && restaurant.userID.toString() === req.user._id.toString()) {
		const newMenuItem = {
			userID: req.user._id,
			restaurantID: restaurant._id,
			name,
			image,
			description,
		};

		restaurant.menu.push(newMenuItem);
		await restaurant.save();
		res.json(restaurant);
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

const editItem = asyncHandler(async (req, res) => {
	const { restaurantID, name, image, description } = req.body;

	const restaurant = await Restaurant.findById({ _id: restaurantID });

	if (restaurant && restaurant.userID.toString() === req.user._id.toString()) {
		const item = restaurant.menu.find(
			(menuItem) =>
				menuItem.restaurantID.toString() === restaurant._id.toString() &&
				menuItem.userID.toString() === req.user._id.toString() &&
				menuItem._id.toString() === req.params.id
		);

		if (!item) {
			res.status(404);
			throw new Error('Item ID does not exist');
		}

		restaurant.menu = restaurant.menu.filter((menuItem) => menuItem._id.toString() !== req.params.id);

		const newMenuItem = {
			userID: req.user._id,
			restaurantID: restaurant._id,
			name,
			image,
			description,
		};

		restaurant.menu.push(newMenuItem);
		await restaurant.save();
		res.json(restaurant);
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

const deleteItem = asyncHandler(async (req, res) => {
	const { restaurantID } = req.body;

	const restaurant = await Restaurant.findById({ _id: restaurantID });

	if (restaurant && restaurant.userID.toString() === req.user._id.toString()) {
		const item = restaurant.menu.find(
			(menuItem) =>
				menuItem.restaurantID.toString() === restaurant._id.toString() &&
				menuItem.userID.toString() === req.user._id.toString() &&
				menuItem._id.toString() === req.params.id
		);

		if (!item) {
			res.status(404);
			throw new Error('Item ID does not exist');
		}
		restaurant.menu = restaurant.menu.filter((menuItem) => menuItem._id.toString() !== req.params.id);

		await restaurant.save();
		res.json(restaurant);
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

router
	.route('/')
	.post(
		auth.protectedRoute,
		validate([
			body('restaurantID').isString(),
			body('name').isString(),
			body('image').isString().isURL(),
			body('description').isString(),
		]),
		addItem
	);

router
	.route('/:id')
	.put(
		auth.protectedRoute,
		validate([
			param('id').isString(),
			body('restaurantID').isString(),
			body('name').isString(),
			body('image').isString().isURL(),
			body('description').isString(),
		]),
		editItem
	)
	.delete(
		auth.protectedRoute,
		validate([param('id').isString(), body('restaurantID').isString()]),
		deleteItem
	);

export default router;
