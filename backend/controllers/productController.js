import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

const imageFieldNames = Array.from({ length: 10 }, (_, index) => `image${index + 1}`)
const videoFieldNames = Array.from({ length: 2 }, (_, index) => `video${index + 1}`)

const parseJsonField = (value, fallback) => {
    if (value === undefined || value === null || value === '') {
        return fallback
    }

    try {
        return JSON.parse(value)
    } catch {
        return fallback
    }
}

const uploadFiles = async (files = {}) => {
    const uploadedImages = imageFieldNames
        .map((fieldName) => files[fieldName]?.[0])
        .filter(Boolean)

    const imagesUrl = await Promise.all(
        uploadedImages.map(async(item)=>{
            const result = await cloudinary.uploader.upload(item.path,{resource_type:'image'});
            return result.secure_url
        })
    )

    const uploadedVideos = videoFieldNames
        .map((fieldName) => files[fieldName]?.[0])
        .filter(Boolean)

    const videosUrl = await Promise.all(
        uploadedVideos.map(async(item)=>{
            const result = await cloudinary.uploader.upload(item.path, { resource_type: 'video' })
            return result.secure_url
        })
    )

    return { imagesUrl, videosUrl }
}

const buildProductPayload = (body, media) => ({
    name: body.name,
    description: body.description,
    category: body.category,
    price: Number(body.price),
    compareAtPrice: Number(body.compareAtPrice || 0),
    costPerItem: Number(body.costPerItem || 0),
    subCategory: body.subCategory,
    bestseller: body.bestseller === "true" ? true : false,
    sizes: parseJsonField(body.sizes, []),
    image: media.images,
    video: media.videos[0] || '',
    videos: media.videos,
    sku: body.sku || '',
    stockQuantity: Number(body.stockQuantity || 0),
    allowBackorder: body.allowBackorder === "true" ? true : false,
    minimumOrderQuantity: Number(body.minimumOrderQuantity || 1),
    processingTimeDays: Number(body.processingTimeDays || 0),
    customizationAvailable: body.customizationAvailable === "true" ? true : false,
    customizationNotes: body.customizationNotes || '',
    productVariants: parseJsonField(body.productVariants, []),
})

//function for add product
const addProduct = async(req,res) => {
    try{
        const { name,description,price,category,subCategory,sizes,bestseller } = req.body
        const { imagesUrl, videosUrl } = await uploadFiles(req.files)

        if (imagesUrl.length === 0) {
            return res.json({ success: false, message: 'At least one image is required' })
        }

        const productData = {
            ...buildProductPayload(
                { name, description, price, category, subCategory, sizes, bestseller },
                { images: imagesUrl, videos: videosUrl }
            ),
            date: Date.now()
        }

        const product = new productModel(productData);
        await product.save();

        res.json({success:true,message:"Product Added"});

    } catch(error){
        console.log(error)
        res.json({success:false,message:error.message})
    }

}

const updateProduct = async (req, res) => {
    try {
        const { id } = req.body
        const product = await productModel.findById(id)

        if (!product) {
            return res.json({ success: false, message: 'Product not found' })
        }

        const { imagesUrl, videosUrl } = await uploadFiles(req.files)
        const preservedImages = parseJsonField(req.body.existingImages, [])
        const preservedVideos = parseJsonField(
            req.body.existingVideos,
            product.videos?.length ? product.videos : (product.video ? [product.video] : [])
        )
        const nextImages = [...preservedImages, ...imagesUrl]
        const nextVideos = [...preservedVideos, ...videosUrl]

        if (nextImages.length === 0) {
            return res.json({ success: false, message: 'At least one image is required' })
        }

        const updateData = buildProductPayload(req.body, {
            images: nextImages,
            videos: nextVideos
        })

        await productModel.findByIdAndUpdate(id, updateData)
        res.json({ success: true, message: 'Product Updated' })
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}
//function for list product
const listProducts = async(req,res) => {
    try{
        const products = await productModel.find({});
        res.json({success:true,products})

    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}
//function for removing product
const removeProduct = async(req,res) => {
    try{
        await productModel.findByIdAndDelete(req.body.id)
        res.json({success:true,message:"Product Removed"})
    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}
//function for single product info
const singleProduct = async(req,res) => {
    try{
        const { productId } = req.body
        const product = await productModel.findById(productId)
        res.json({success:true,product})
    } catch(error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}
export {listProducts,addProduct,updateProduct,removeProduct,singleProduct}
