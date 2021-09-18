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

const getRestaurants = asyncHandler(async (req, res) => {
	const restaurantsPerPage = 6;
	const pageNo = Number(req.query.pageNo) || 1;
	console.log(req.query.keyword);
	const nameKeyword = req.query.keyword
		? {
				name: {
					$regex: req.query.keyword,
					$options: 'i',
				},
		  }
		: {};
	const descriptionKeyword = req.query.keyword
		? {
				description: {
					$regex: req.query.keyword,
					$options: 'i',
				},
		  }
		: {};
	const categoryKeyword = req.query.keyword
		? {
				category: {
					$regex: req.query.keyword,
					$options: 'i',
				},
		  }
		: {};
	const restaurantCount = await Restaurant.countDocuments({
		$or: [{ ...nameKeyword }, { ...categoryKeyword }, { ...descriptionKeyword }],
	});

	if (restaurantCount) {
		const pages = Math.ceil(restaurantCount / restaurantsPerPage);

		if (pages < pageNo) {
			res.status(404);
			throw new Error('No restaurants to show');
		}

		const restaurants = await Restaurant.find({
			$or: [{ ...nameKeyword }, { ...categoryKeyword }, { ...descriptionKeyword }],
		})
			.limit(restaurantsPerPage)
			.skip(restaurantsPerPage * (pageNo - 1));

		res.json({ restaurants, pages });
	} else {
		res.status(404);
		throw new Error('No restaurants to show');
	}
});

const getRestaurantDetails = asyncHandler(async (req, res) => {
	const restaurant = await Restaurant.findById(req.params.id);
	if (restaurant) {
		res.json(restaurant);
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

const addRestaurant = asyncHandler(async (req, res) => {
	const { name, image, description, category } = req.body;

	const nameExists = await Restaurant.findOne({ name });

	if (nameExists) {
		throw new Error('Restaurant name already exists');
	}

	const restaurant = await Restaurant.create({
		userID: req.user._id,
		name,
		image,
		description,
		category,
	});

	if (restaurant) {
		res.json(restaurant);
	} else {
		res.status(500);
		throw new Error('Restaurant could not be created.');
	}
});

const editRestaurant = asyncHandler(async (req, res) => {
	const { name, image, description, category } = req.body;

	const restaurant = await Restaurant.findById(req.params.id);
	if (restaurant && restaurant.userID.toString() === req.user._id.toString()) {
		restaurant.name = name ?? restaurant.name;
		restaurant.image = image ?? restaurant.image;
		restaurant.description = description ?? restaurant.description;
		restaurant.category = category ?? restaurant.category;

		await restaurant.save();
		res.json(restaurant);
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

const deleteRestaurant = asyncHandler(async (req, res) => {
	const restaurant = await Restaurant.findById(req.params.id);

	if (restaurant && restaurant.userID.toString() === req.user._id.toString()) {
		await Restaurant.deleteOne({ _id: restaurant._id });
		res.json({});
	} else {
		res.status(404);
		throw new Error('Restaurant not found');
	}
});

router
	.route('/')
	.get(
		validate([query('pageNo').optional().isNumeric(), query('keyword').isString().optional()]),
		getRestaurants
	)
	.post(
		auth.protectedRoute,
		validate([
			body('name').isString().isLength({ min: 5 }),
			body('image').isString().isURL(),
			body('description').isString(),
			body('category').isString().isLength({ min: 4, max: 10 }),
		]),
		addRestaurant
	);

router
	.route('/:id')
	.get(validate([param('id').isString()]), getRestaurantDetails)
	.put(
		validate([
			param('id').isString(),
			body('name').isString().isLength({ min: 5 }),
			body('image').isString().isURL(),
			body('description').isString(),
			body('category').isString().isLength({ min: 4, max: 10 }),
		]),
		auth.protectedRoute,
		editRestaurant
	)
	.delete(validate([param('id').isString()]), auth.protectedRoute, deleteRestaurant);

export default router;
