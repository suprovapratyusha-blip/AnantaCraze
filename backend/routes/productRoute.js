import express from 'express'
import {listProducts,addProduct,updateProduct,removeProduct,singleProduct} from '../controllers/productController.js'
import upload from '../middleware/multer.js';
import adminAuth from '../middleware/adminAuth.js';

const productRouter = express.Router();
const mediaFields = [
    ...Array.from({ length: 10 }, (_, index) => ({ name: `image${index + 1}`, maxCount: 1 })),
    ...Array.from({ length: 2 }, (_, index) => ({ name: `video${index + 1}`, maxCount: 1 }))
]

productRouter.post('/add',adminAuth,upload.fields(mediaFields),addProduct);
productRouter.post('/update',adminAuth,upload.fields(mediaFields),updateProduct);
productRouter.post('/remove',adminAuth,removeProduct);
productRouter.post('/single',singleProduct);
productRouter.get('/list',listProducts)

export default productRouter
