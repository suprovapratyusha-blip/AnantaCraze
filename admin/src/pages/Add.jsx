import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: 'Dress',
  subCategory: 'Gopal',
  bestseller: false,
  sizes: []
}

const Add = ({token}) => {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isEditMode = Boolean(productId)

  const [image1, setImage1] = useState(false)
  const [image2, setImage2] = useState(false)
  const [image3, setImage3] = useState(false)
  const [image4, setImage4] = useState(false)
  const [video, setVideo] = useState(false)
  const [existingImages, setExistingImages] = useState([])
  const [existingVideo, setExistingVideo] = useState('')
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const imageSlots = useMemo(() => ([
    { key: 'image1', file: image1, setter: setImage1, existing: existingImages[0] || '' },
    { key: 'image2', file: image2, setter: setImage2, existing: existingImages[1] || '' },
    { key: 'image3', file: image3, setter: setImage3, existing: existingImages[2] || '' },
    { key: 'image4', file: image4, setter: setImage4, existing: existingImages[3] || '' }
  ]), [existingImages, image1, image2, image3, image4])

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((item) => item !== size)
        : [...prev.sizes, size]
    }))
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setImage1(false)
    setImage2(false)
    setImage3(false)
    setImage4(false)
    setVideo(false)
    setExistingImages([])
    setExistingVideo('')
  }

  const loadProduct = async () => {
    if (!productId) {
      return
    }

    try {
      setLoading(true)
      const response = await axios.post(backendUrl + '/api/product/single', { productId })
      if (!response.data.success) {
        toast.error(response.data.message)
        return
      }

      const product = response.data.product
      setFormData({
        name: product.name,
        description: product.description,
        price: String(product.price),
        category: product.category,
        subCategory: product.subCategory,
        bestseller: Boolean(product.bestseller),
        sizes: product.sizes || []
      })
      setExistingImages(product.image || [])
      setExistingVideo(product.video || '')
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isEditMode) {
      loadProduct()
    } else {
      resetForm()
    }
  }, [productId])

  const onSubmitHandler = async(e) => {
    e.preventDefault();
    try{
      const payload = new FormData()

      payload.append("name", formData.name)
      payload.append("description", formData.description)
      payload.append("price", formData.price)
      payload.append("category", formData.category)
      payload.append("subCategory", formData.subCategory)
      payload.append("bestseller", formData.bestseller)
      payload.append("sizes", JSON.stringify(formData.sizes))

      image1 && payload.append("image1", image1)
      image2 && payload.append("image2", image2)
      image3 && payload.append("image3", image3)
      image4 && payload.append("image4", image4)
      video && payload.append("video", video)

      if (isEditMode) {
        payload.append("id", productId)
        payload.append("existingImages", JSON.stringify(existingImages))
        payload.append("existingVideo", existingVideo)
      }
      
      const endpoint = isEditMode ? "/api/product/update" : "/api/product/add"
      const response = await axios.post(backendUrl + endpoint, payload, {headers:{token}})
      if(response.data.success){
        toast.success(response.data.message)
        if (isEditMode) {
          navigate('/list')
        } else {
          resetForm()
        }
      } else{
        toast.error(response.data.message)
      }

    } catch(error){
      console.log(error);
      toast.error(error.message)

    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex flex-col w-full items-start gap-3'>
    <div>
      <p className='mb-2'>Upload Images</p>
      <div className='flex gap-2 flex-wrap'>
        {imageSlots.map((slot, index) => {
          const preview = slot.file
            ? URL.createObjectURL(slot.file)
            : slot.existing || assets.upload_area

          return (
            <div key={slot.key} className='flex flex-col gap-1'>
              <label htmlFor={slot.key}>
                <img className='w-20 h-20 object-cover border' src={preview} alt="" />
                <input onChange={(e)=>slot.setter(e.target.files[0])} type="file" id={slot.key} accept='image/*' hidden/>
              </label>
              {!slot.file && slot.existing && (
                <button
                  type='button'
                  onClick={() => removeExistingImage(index)}
                  className='text-xs text-red-500'
                >
                  Remove
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
    <div>
      <p className='mb-2'>Upload Video</p>
      <div className='flex items-start gap-3'>
        <label htmlFor="video" className='flex h-20 w-32 cursor-pointer items-center justify-center border text-xs text-gray-500'>
          {video ? video.name : existingVideo ? 'Replace Video' : 'Upload Video'}
          <input onChange={(e)=>setVideo(e.target.files[0])} type="file" id="video" accept='video/*' hidden/>
        </label>
        {(video || existingVideo) && (
          <div className='text-xs text-gray-500'>
            <p>{video ? video.name : 'Existing video attached'}</p>
            {existingVideo && !video && (
              <button type='button' onClick={() => setExistingVideo('')} className='mt-1 text-red-500'>
                Remove Video
              </button>
            )}
          </div>
        )}
      </div>
    </div>
    <div className='w-full'>
      <p className='mb-2'>Product Name</p>
      <input onChange={(e)=>updateForm('name', e.target.value)} value={formData.name} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Type Here' required />
    </div>
    <div className='w-full'>
      <p className='mb-2'>Product Description</p>
      <textarea onChange={(e)=>updateForm('description', e.target.value)} value={formData.description} className='w-full max-w-[500px] px-3 py-2' type="text" placeholder='Write content here' required />
    </div>
    <div className='flex flex-col sm:flex-row gap-2 w-full sm:gap-8'>
      <div>
        <p className='mb-2'>Product Category</p>
        <select onChange={(e)=>updateForm('category', e.target.value)} value={formData.category} className='w-full px-3 py-2'>
          <option value="Dress">Dress</option>
          <option value="Jewellery">Jewellery</option>
    
        </select>
      </div>
      <div>
        <p className='mb-2'>Product Subcategory</p>
        <select onChange={(e)=>updateForm('subCategory', e.target.value)} value={formData.subCategory} className='w-full px-3 py-2'>
          <option value="Gopal">Gopal</option>
          <option value="Yugal jodi">Yugal jodi</option>
          <option value="Lehenga,Choli">Lehenga,Choli</option>
          <option value="Mukut">Mukut</option>
          <option value="Chandrika">Chandrika</option>
          <option value="Mangtika">Mangtika</option>
          <option value="Necklace">Necklace</option>
        </select>
      </div>
      <div>
        <p className='mb-2'>Product Price</p>
        <input onChange={(e)=>updateForm('price', e.target.value)} value={formData.price} className='w-full px-3 py-2 sm:w-[120px]' type="number" placeholder='100' required/>
      </div>
    </div>
    <div>
      <p className='mb-2'>Product Sizes</p>
      <div className='flex gap-3'>
        {["0-1", "2-3", "4-5", "6-7", "8-9", "10-11"].map((size) => (
          <div key={size} onClick={() => toggleSize(size)}>
            <p className={`${formData.sizes.includes(size) ? 'bg-yellow-200' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>{size}</p>
          </div>
        ))}
      </div>
    </div>
    <div className='flex gap-2 mt-2'>
      <input onChange={()=>updateForm('bestseller', !formData.bestseller)} checked={formData.bestseller} type="checkbox" id="bestseller" />
      <label className='cursor-pointer' htmlFor="bestseller">Add to bestseller</label>
    </div>
    <button type='submit' disabled={loading} className='w-40 py-3 mt-4 bg-black text-white disabled:opacity-60'>
      {isEditMode ? 'UPDATE PRODUCT' : 'ADD PRODUCT'}
    </button>
    </form>
  )
}

export default Add
