import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import Stripe from 'stripe'

//Global variables
const currency = 'inr'
const deliveryCharge = 10
const codConfirmationCharge = 10

// gateway initialize 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

const enrichOrderItemsWithImages = async (orders) => {
    const productIds = [...new Set(
        orders.flatMap((order) =>
            (order.items || [])
                .map((item) => item?._id)
                .filter(Boolean)
                .map((id) => id.toString())
        )
    )]

    if (productIds.length === 0) {
        return orders
    }

    const products = await productModel.find({ _id: { $in: productIds } }).select('_id image')
    const productMap = new Map(products.map((product) => [product._id.toString(), product.image || []]))

    return orders.map((order) => ({
        ...order.toObject(),
        items: (order.items || []).map((item) => {
            const hasImage = Array.isArray(item?.image) ? item.image.length > 0 : Boolean(item?.image)

            if (hasImage || !item?._id) {
                return item
            }

            return {
                ...item,
                image: productMap.get(item._id.toString()) || []
            }
        })
    }))
}


//Placing COD orders with a small online confirmation payment
const placeOrder = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers

        if (!items || !amount || !address) {
            return res.json({ success: false, message: "Missing order details" });
        }

        const confirmationAmount = Math.min(codConfirmationCharge, amount)
        const cashOnDeliveryAmount = Math.max(amount - confirmationAmount, 0)

        const order = {
            userId,
            items,
            address,
            amount,
            advancePaymentAmount: confirmationAmount,
            cashOnDeliveryAmount,
            paymentMethod: 'COD',
            payment: false,
            paymentStatus: 'Confirmation Payment Pending',
            date: Date.now()
        }
        const newOrder = new orderModel(order)
        await newOrder.save()

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items: [
                {
                    price_data: {
                        currency,
                        product_data: {
                            name: 'COD Confirmation Amount'
                        },
                        unit_amount: confirmationAmount * 100
                    },
                    quantity: 1
                }
            ],
            mode: 'payment',
            metadata: {
                orderId: newOrder._id.toString(),
                paymentMethod: 'COD'
            }
        })

        res.json({
            success: true,
            session_url: session.url,
            confirmationAmount,
            cashOnDeliveryAmount
        })
    }
    catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}


//Placing Orders using Stripe Method
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body;
        const { origin } = req.headers

        const order = {
            userId,
            items,
            address,
            amount,
            advancePaymentAmount: amount,
            cashOnDeliveryAmount: 0,
            paymentMethod: 'Stripe',
            payment: false,
            paymentStatus: 'Online Payment Pending',
            date: Date.now()
        }

        const newOrder = new orderModel(order)
        await newOrder.save()

        const line_items = items.map((item) => ({
            price_data : {
                currency:currency,
                product_data: {
                    name:item.name
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        line_items.push({
            price_data : {
                currency:currency,
                product_data: {
                    name:"Pratyusha Charges"
                },
                unit_amount: deliveryCharge * 100
            },
            quantity: 1
        })

        const session = await stripe.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:  `${origin}/verify?success=false&orderId=${newOrder._id}`,
            line_items,
            mode: 'payment'
        })

        res.json({success:true,session_url:session.url})

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//Verify Stripe
const verifyStripe = async (req,res) => {

    const { orderId, success, userId } = req.body

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.json({success: false, message: 'Order not found'})
        }

        if (success === "true") {
            const paymentStatus = order.paymentMethod === 'COD'
                ? 'Confirmation Paid, Cash on Delivery Pending'
                : 'Paid in Full'

            await orderModel.findByIdAndUpdate(orderId, {
                payment: true,
                paymentStatus
            });
            await userModel.findByIdAndUpdate(userId, {cartData: {}})
            res.json({success: true});
        }else{
            await orderModel.findByIdAndDelete(orderId)
            res.json({success:false})
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

//Placing Orders using RazorPay Method
const placeOrderRazorpay = async (req, res) => {

}

//All Orders data for Admin Panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        const enrichedOrders = await enrichOrderItemsWithImages(orders)
        res.json({ success: true, orders: enrichedOrders })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }

}

//User Order data for Frontend
const userOrders = async (req, res) => {
    try {
        const { userId } = req.body
        const orders = await orderModel.find({ userId })
        const enrichedOrders = await enrichOrderItemsWithImages(orders)
        res.json({ success: true, orders: enrichedOrders })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })

    }
}

//Update Order Status from Admin Panel
const updateStatus = async (req, res) => {

    try {

        const { orderId, status } = req.body

        await orderModel.findByIdAndUpdate(orderId, { status })
        res.json({ success: true, message: 'Status Updated' })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { verifyStripe, placeOrder, placeOrderStripe, placeOrderRazorpay, allOrders, userOrders, updateStatus }
