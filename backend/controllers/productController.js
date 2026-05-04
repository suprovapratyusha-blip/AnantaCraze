import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

const uploadFiles = async (files = {}) => {
    const uploadedImages = [files.image1?.[0], files.image2?.[0], files.image3?.[0], files.image4?.[0]]
        .filter(Boolean)

    const imagesUrl = await Promise.all(
        uploadedImages.map(async(item)=>{
            const result = await cloudinary.uploader.upload(item.path,{resource_type:'image'});
            return result.secure_url
        })
    )

    let videoUrl = ''
    if (files.video?.[0]) {
        const result = await cloudinary.uploader.upload(files.video[0].path, { resource_type: 'video' })
        videoUrl = result.secure_url
    }

    return { imagesUrl, videoUrl }
}

const buildProductPayload = (body, media) => ({
    name: body.name,
    description: body.description,
    category: body.category,
    price: Number(body.price),
    subCategory: body.subCategory,
    bestseller: body.bestseller === "true" ? true : false,
    sizes: JSON.parse(body.sizes),
    image: media.images,
    video: media.video,
})

//function for add product
const addProduct = async(req,res) => {
    try{
        const { name,description,price,category,subCategory,sizes,bestseller } = req.body
        const { imagesUrl, videoUrl } = await uploadFiles(req.files)

        if (imagesUrl.length === 0) {
            return res.json({ success: false, message: 'At least one image is required' })
        }

        const productData = {
            ...buildProductPayload(
                { name, description, price, category, subCategory, sizes, bestseller },
                { images: imagesUrl, video: videoUrl }
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
        const { id, existingImages = '[]', existingVideo = '' } = req.body
        const product = await productModel.findById(id)

        if (!product) {
            return res.json({ success: false, message: 'Product not found' })
        }

        const { imagesUrl, videoUrl } = await uploadFiles(req.files)
        const preservedImages = JSON.parse(existingImages)
        const nextImages = [...preservedImages, ...imagesUrl]

        if (nextImages.length === 0) {
            return res.json({ success: false, message: 'At least one image is required' })
        }

        const updateData = buildProductPayload(req.body, {
            images: nextImages,
            video: videoUrl || existingVideo
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
