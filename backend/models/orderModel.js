import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true},
    items: { type: Array, required: true},
    amount: { type: Number, required: true},
    advancePaymentAmount: { type: Number, default: 0},
    cashOnDeliveryAmount: { type: Number, default: 0},
    address: { type: Object, required: true},
    status: { type: String, required: true, default:'Order Placed'},
    paymentMethod: { type: String, required: true},
    payment: { type: Boolean, required: true , default:false},
    paymentStatus: { type: String, default: 'Pending'},
    date: { type: Number, required: true},
})

const orderModel = mongoose.models.order || mongoose.model('order',orderSchema)
export default orderModel;  
