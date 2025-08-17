import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

//PLACING ORDERS USING COD METHODS

const placeOrder = async (req,res) => {  

    try {
        
        const { userId, items, amount, address} = req.body;

        const orderData = {
            userId,
            items,
            address,
            amount,
            paymentMethod:'COD',
            payment:false,
            date:Date.now()
        }

        const newOrder = new orderModel(orderData)
        await newOrder.save()
        await userModel.findByIdAndUpdate(userId,{cartData: {}})

        res.json({success:true, mesaage:"Order Placed"})


    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
        
    }
}

//PLACING ORDERS USING STRIPE METHODS

const placeOrderStripe = async (req,res) => {
    
}

//PLACING ORDERS USING RAZORPAY METHODS

const placeOrderRazorpay = async (req,res) => {
    
}

//ALL ORDERS FOR ADMIN PANEL
const allOrders = async (req,res) => {

}

//USER ORDER DATA FOR FRONTEND

const userOrders = async (req,res) => {

}

//UPDATE ORDER STATUS FROM ADMIN PANEL

const updateStatus = async (req,res) => {

}

export {placeOrder, placeOrderRazorpay, placeOrderStripe, allOrders, userOrders, updateStatus}