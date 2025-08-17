import express from 'express'
import {placeOrder, placeOrderRazorpay, placeOrderStripe, allOrders, userOrders, updateStatus} from '../controllers/orderController.js'
import adminAuth from '../middleware/adminAuth.js'
import authUser from '../middleware/auth.js'

const orderRouter = express.Router()

//ADMIN FEATURES
orderRouter.post('list',adminAuth,allOrders)
orderRouter.post('list',adminAuth,updateStatus)

//PAYMENT FEATURES
orderRouter.post('/place',authUser,placeOrder)
orderRouter.post('/stripe',authUser,placeOrderStripe)
orderRouter.post('/raqzorpay',authUser,placeOrderRazorpay)

//USER FEATURES
orderRouter.post('/userorders',authUser,userOrders)

export default orderRouter