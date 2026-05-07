import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
    name: {type:String, required:true }, 
    description: {type: String, required: true},
    price: {type: Number, required: true},
    compareAtPrice: {type: Number, default: 0},
    costPerItem: {type: Number, default: 0},
    image: {type: Array, required: true},
    video: {type: String, default: ''},
    videos: {type: Array, default: []},
    category: {type: String, required: true},
    subCategory: {type: String, required: true},
    sizes: {type: Array, required: true},
    sku: {type: String, default: ''},
    stockQuantity: {type: Number, default: 0},
    allowBackorder: {type: Boolean, default: false},
    minimumOrderQuantity: {type: Number, default: 1},
    processingTimeDays: {type: Number, default: 0},
    customizationAvailable: {type: Boolean, default: false},
    customizationNotes: {type: String, default: ''},
    productVariants: {type: Array, default: []},
    bestseller:{type: Boolean},
    date:{type: Number, required: true}
})
const productModel = mongoose.models.product || mongoose.model("product",productSchema);
export default productModel
