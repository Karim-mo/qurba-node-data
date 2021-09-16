import express from 'express';
import asyncHandler from 'express-async-handler';
import { body } from 'express-validator';
import { FormValidation, Auth, Database } from 'qurba-node-common';

// Grab the user schema
const User = Database.Schemas.User;
const Item = Database.Schemas.Item;
const Restaurant = Database.Schemas.Restaurant;

// Assign a reference to avoid using the long name every time
const validate = FormValidation.validate;

const router = express.Router();

export default router;
