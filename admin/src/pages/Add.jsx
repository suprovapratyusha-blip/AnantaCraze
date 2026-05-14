import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'
import { categoryOptions, defaultCategory, defaultSubCategory } from '../data/productOptions'

const variantNameOptions = ['Color', 'Size', 'Material', 'Style']
const maxImageSlots = 10
const maxVideoSlots = 2
const sizeOptions = ['Free Size', '0-1', '2-3', '4-5', '6-7', '8-9', '10-11']
const customCategoryOption = '__add_new_category__'
const customSubCategoryOption = '__add_new_sub_category__'

const createEmptySlots = (count) => Array.from({ length: count }, () => false)

const emptyForm = {
  name: '',
  description: '',
  price: '',
  compareAtPrice: '',
  costPerItem: '',
  category: defaultCategory,
  subCategory: defaultSubCategory,
  bestseller: false,
  sizes: [],
  sku: '',
  stockQuantity: '',
  allowBackorder: false,
  minimumOrderQuantity: '1',
  processingTimeDays: '',
  customizationAvailable: false,
  customizationNotes: '',
  productVariants: []
}

const normalizeVariantGroups = (variants = []) => {
  if (!Array.isArray(variants)) {
    return []
  }

  if (variants.every((variant) => variant?.name && Array.isArray(variant.values))) {
    return variants.map((variant) => ({
      name: variant.name,
      values: variant.values.filter(Boolean),
      quantity: variant.quantity !== undefined && variant.quantity !== null ? String(variant.quantity) : ''
    }))
  }

  const groupedVariants = new Map()
  variants.forEach((variant) => {
    const groupName = variant?.label || variant?.name || 'Color'
    const groupValues = groupedVariants.get(groupName) || []
    const nextValue = variant?.value?.trim?.() || ''

    if (nextValue && !groupValues.includes(nextValue)) {
      groupValues.push(nextValue)
    }

    groupedVariants.set(groupName, groupValues)
  })

  return Array.from(groupedVariants.entries()).map(([name, values]) => ({ name, values, quantity: '' }))
}

const parsePositiveNumber = (value) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

const Add = ({ token }) => {
  const navigate = useNavigate()
  const { productId } = useParams()
  const isEditMode = Boolean(productId)

  const [imageFiles, setImageFiles] = useState(() => createEmptySlots(maxImageSlots))
  const [videoFiles, setVideoFiles] = useState(() => createEmptySlots(maxVideoSlots))
  const [existingImages, setExistingImages] = useState([])
  const [existingVideos, setExistingVideos] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [variantDrafts, setVariantDrafts] = useState([])
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false)
  const [customSubCategory, setCustomSubCategory] = useState('')

  const imageSlots = useMemo(() => (
    Array.from({ length: maxImageSlots }, (_, index) => ({
      key: `image${index + 1}`,
      file: imageFiles[index],
      existing: existingImages[index] || ''
    }))
  ), [existingImages, imageFiles])

  const videoSlots = useMemo(() => (
    Array.from({ length: maxVideoSlots }, (_, index) => ({
      key: `video${index + 1}`,
      file: videoFiles[index],
      existing: existingVideos[index] || ''
    }))
  ), [existingVideos, videoFiles])

  const subCategoryOptions = categoryOptions[formData.category] || []
  const categorySelectValue = isCustomCategory ? customCategoryOption : formData.category
  const subCategorySelectValue = isCustomSubCategory ? customSubCategoryOption : formData.subCategory

  const discountPercent = useMemo(() => {
    const sellingPrice = parsePositiveNumber(formData.price)
    const mrp = parsePositiveNumber(formData.compareAtPrice)

    if (mrp <= 0 || sellingPrice <= 0 || sellingPrice > mrp) {
      return ''
    }

    return (((mrp - sellingPrice) / mrp) * 100).toFixed(2).replace(/\.00$/, '')
  }, [formData.compareAtPrice, formData.price])

  const updateForm = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const updateCategory = (category) => {
    if (category === customCategoryOption) {
      setIsCustomCategory(true)
      setCustomCategory('')
      setIsCustomSubCategory(true)
      setCustomSubCategory('')
      setFormData((prev) => ({
        ...prev,
        category: '',
        subCategory: ''
      }))
      return
    }

    const firstSubCategory = categoryOptions[category]?.[0] || ''
    setIsCustomCategory(false)
    setCustomCategory('')
    setIsCustomSubCategory(false)
    setCustomSubCategory('')
    setFormData((prev) => ({
      ...prev,
      category,
      subCategory: firstSubCategory
    }))
  }

  const updateCustomCategory = (value) => {
    setCustomCategory(value)
    setFormData((prev) => ({
      ...prev,
      category: value
    }))
  }

  const updateSubCategory = (subCategory) => {
    if (subCategory === customSubCategoryOption) {
      setIsCustomSubCategory(true)
      setCustomSubCategory('')
      setFormData((prev) => ({
        ...prev,
        subCategory: ''
      }))
      return
    }

    setIsCustomSubCategory(false)
    setCustomSubCategory('')
    updateForm('subCategory', subCategory)
  }

  const updateCustomSubCategory = (value) => {
    setCustomSubCategory(value)
    setFormData((prev) => ({
      ...prev,
      subCategory: value
    }))
  }

  const updateMrp = (value) => {
    setFormData((prev) => {
      const nextForm = { ...prev, compareAtPrice: value }

      if (!prev.price && value) {
        nextForm.price = value
      }

      return nextForm
    })
  }

  const updateDiscount = (value) => {
    const mrp = parsePositiveNumber(formData.compareAtPrice)
    if (!mrp) {
      return
    }

    if (value === '') {
      updateForm('price', formData.compareAtPrice)
      return
    }

    const discount = Math.min(Math.max(parsePositiveNumber(value), 0), 100)
    const discountedPrice = (mrp * (100 - discount)) / 100
    updateForm('price', discountedPrice ? discountedPrice.toFixed(2).replace(/\.00$/, '') : '')
  }

  const updateImageFile = (index, file) => {
    setImageFiles((prev) => prev.map((item, currentIndex) => currentIndex === index ? file : item))
  }

  const updateVideoFile = (index, file) => {
    setVideoFiles((prev) => prev.map((item, currentIndex) => currentIndex === index ? file : item))
  }

  const toggleSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((item) => item !== size)
        : [...prev.sizes, size]
    }))
  }

  const addVariantOption = () => {
    setFormData((prev) => ({
      ...prev,
      productVariants: [...prev.productVariants, { name: 'Color', values: [], quantity: '' }]
    }))
    setVariantDrafts((prev) => [...prev, ''])
  }

  const updateVariantOption = (index, key, value) => {
    setFormData((prev) => ({
      ...prev,
      productVariants: prev.productVariants.map((variant, currentIndex) =>
        currentIndex === index ? { ...variant, [key]: value } : variant
      )
    }))
  }

  const updateVariantDraft = (index, value) => {
    setVariantDrafts((prev) => prev.map((item, currentIndex) => currentIndex === index ? value : item))
  }

  const addVariantValues = (index) => {
    const draftValue = variantDrafts[index] || ''
    const nextValues = draftValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (nextValues.length === 0) {
      return
    }

    setFormData((prev) => ({
      ...prev,
      productVariants: prev.productVariants.map((variant, currentIndex) => {
        if (currentIndex !== index) {
          return variant
        }

        const mergedValues = [...variant.values]
        nextValues.forEach((value) => {
          if (!mergedValues.includes(value)) {
            mergedValues.push(value)
          }
        })

        return {
          ...variant,
          values: mergedValues
        }
      })
    }))

    setVariantDrafts((prev) => prev.map((item, currentIndex) => currentIndex === index ? '' : item))
  }

  const removeVariantValue = (index, valueIndex) => {
    setFormData((prev) => ({
      ...prev,
      productVariants: prev.productVariants.map((variant, currentIndex) =>
        currentIndex === index
          ? { ...variant, values: variant.values.filter((_, currentValueIndex) => currentValueIndex !== valueIndex) }
          : variant
      )
    }))
  }

  const removeVariantOption = (index) => {
    setFormData((prev) => ({
      ...prev,
      productVariants: prev.productVariants.filter((_, currentIndex) => currentIndex !== index)
    }))
    setVariantDrafts((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const removeExistingVideo = (index) => {
    setExistingVideos((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
  }

  const resetForm = () => {
    setFormData(emptyForm)
    setImageFiles(createEmptySlots(maxImageSlots))
    setVideoFiles(createEmptySlots(maxVideoSlots))
    setExistingImages([])
    setExistingVideos([])
    setVariantDrafts([])
    setIsCustomCategory(false)
    setCustomCategory('')
    setIsCustomSubCategory(false)
    setCustomSubCategory('')
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
      const normalizedVariants = normalizeVariantGroups(product.productVariants || [])
      const normalizedVideos = Array.isArray(product.videos) && product.videos.length > 0
        ? product.videos
        : product.video
          ? [product.video]
          : []
      const hasPresetCategory = Boolean(categoryOptions[product.category])
      const hasPresetSubCategory = Boolean((categoryOptions[product.category] || []).includes(product.subCategory))

      setFormData({
        name: product.name,
        description: product.description,
        price: String(product.price),
        compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '',
        costPerItem: product.costPerItem ? String(product.costPerItem) : '',
        category: product.category,
        subCategory: product.subCategory,
        bestseller: Boolean(product.bestseller),
        sizes: product.sizes || [],
        sku: product.sku || '',
        stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
        allowBackorder: Boolean(product.allowBackorder),
        minimumOrderQuantity: product.minimumOrderQuantity ? String(product.minimumOrderQuantity) : '1',
        processingTimeDays: product.processingTimeDays ? String(product.processingTimeDays) : '',
        customizationAvailable: Boolean(product.customizationAvailable),
        customizationNotes: product.customizationNotes || '',
        productVariants: normalizedVariants
      })
      setIsCustomCategory(!hasPresetCategory)
      setCustomCategory(!hasPresetCategory ? product.category : '')
      setIsCustomSubCategory(!hasPresetSubCategory)
      setCustomSubCategory(!hasPresetSubCategory ? product.subCategory : '')
      setVariantDrafts(normalizedVariants.map(() => ''))
      setExistingImages(product.image || [])
      setExistingVideos(normalizedVideos)
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

  useEffect(() => {
    if (formData.productVariants.length !== variantDrafts.length) {
      setVariantDrafts(formData.productVariants.map((_, index) => variantDrafts[index] || ''))
    }
  }, [formData.productVariants, variantDrafts])

  const onSubmitHandler = async (e) => {
    e.preventDefault()
    try {
      const payload = new FormData()

      payload.append('name', formData.name)
      payload.append('description', formData.description)
      payload.append('price', formData.price)
      payload.append('compareAtPrice', formData.compareAtPrice)
      payload.append('costPerItem', formData.costPerItem)
      payload.append('category', formData.category)
      payload.append('subCategory', formData.subCategory)
      payload.append('bestseller', formData.bestseller)
      payload.append('sizes', JSON.stringify(formData.sizes))
      payload.append('sku', formData.sku)
      payload.append('stockQuantity', formData.stockQuantity)
      payload.append('allowBackorder', formData.allowBackorder)
      payload.append('minimumOrderQuantity', formData.minimumOrderQuantity)
      payload.append('processingTimeDays', formData.processingTimeDays)
      payload.append('customizationAvailable', formData.customizationAvailable)
      payload.append('customizationNotes', formData.customizationNotes)
      payload.append(
        'productVariants',
        JSON.stringify(
          formData.productVariants.filter(
            (variant) => variant.name && (variant.values.length > 0 || variant.quantity)
          )
        )
      )

      imageFiles.forEach((file, index) => {
        if (file) {
          payload.append(`image${index + 1}`, file)
        }
      })

      videoFiles.forEach((file, index) => {
        if (file) {
          payload.append(`video${index + 1}`, file)
        }
      })

      if (isEditMode) {
        payload.append('id', productId)
        payload.append('existingImages', JSON.stringify(existingImages))
        payload.append('existingVideos', JSON.stringify(existingVideos))
      }

      const endpoint = isEditMode ? '/api/product/update' : '/api/product/add'
      const response = await axios.post(backendUrl + endpoint, payload, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        if (isEditMode) {
          navigate('/list')
        } else {
          resetForm()
        }
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className='flex w-full flex-col items-start gap-6'>
      <section className='w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-2 text-lg font-semibold text-gray-900'>Media</h2>
        <p className='mb-4 text-sm text-gray-500'>Add up to ten product photos and two optional videos.</p>
        <div>
          <p className='mb-2 text-sm font-medium text-gray-700'>Upload Images</p>
          <div className='flex flex-wrap gap-3'>
            {imageSlots.map((slot, index) => {
              const preview = slot.file
                ? URL.createObjectURL(slot.file)
                : slot.existing || assets.upload_area

              return (
                <div key={slot.key} className='flex flex-col gap-1'>
                  <label htmlFor={slot.key}>
                    <img className='h-24 w-24 cursor-pointer rounded-lg border object-cover' src={preview} alt='' />
                    <input onChange={(e) => updateImageFile(index, e.target.files[0])} type='file' id={slot.key} accept='image/*' hidden />
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
        <div className='mt-5'>
          <p className='mb-2 text-sm font-medium text-gray-700'>Upload Videos</p>
          <div className='flex flex-wrap gap-3'>
            {videoSlots.map((slot, index) => (
              <div key={slot.key} className='flex flex-col gap-1'>
                <label htmlFor={slot.key} className='flex h-20 w-40 cursor-pointer items-center justify-center rounded-lg border border-dashed px-3 text-center text-xs text-gray-500'>
                  {slot.file ? slot.file.name : slot.existing ? `Replace Video ${index + 1}` : `Upload Video ${index + 1}`}
                  <input onChange={(e) => updateVideoFile(index, e.target.files[0])} type='file' id={slot.key} accept='video/*' hidden />
                </label>
                {!slot.file && slot.existing && (
                  <button type='button' onClick={() => removeExistingVideo(index)} className='text-xs text-red-500'>
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-2 text-lg font-semibold text-gray-900'>Basic Information</h2>
        <p className='mb-4 text-sm text-gray-500'>A good title and description help customers decide faster.</p>
        <div className='w-full'>
          <p className='mb-2 text-sm font-medium text-gray-700'>Product Name</p>
          <input onChange={(e) => updateForm('name', e.target.value)} value={formData.name} className='w-full max-w-[700px] rounded-lg border px-3 py-2' type='text' placeholder='Type here' required />
        </div>
        <div className='mt-4 w-full'>
          <p className='mb-2 text-sm font-medium text-gray-700'>Product Description</p>
          <textarea onChange={(e) => updateForm('description', e.target.value)} value={formData.description} className='min-h-28 w-full max-w-[700px] rounded-lg border px-3 py-2' placeholder='Write content here' required />
        </div>
        <div className='mt-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap'>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Category</p>
            <select onChange={(e) => updateCategory(e.target.value)} value={categorySelectValue} className='min-w-64 rounded-lg border px-3 py-2'>
              {Object.keys(categoryOptions).map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value={customCategoryOption}>+ Add new category</option>
            </select>
            {isCustomCategory && (
              <input
                type='text'
                value={customCategory}
                onChange={(e) => updateCustomCategory(e.target.value)}
                className='mt-2 w-full min-w-64 rounded-lg border px-3 py-2'
                placeholder='Type new category'
                required
              />
            )}
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Sub category</p>
            <select onChange={(e) => updateSubCategory(e.target.value)} value={subCategorySelectValue} className='min-w-64 rounded-lg border px-3 py-2'>
              {subCategoryOptions.map((subCategory) => (
                <option key={subCategory} value={subCategory}>{subCategory}</option>
              ))}
              <option value={customSubCategoryOption}>+ Add new sub category</option>
            </select>
            {isCustomSubCategory && (
              <input
                type='text'
                value={customSubCategory}
                onChange={(e) => updateCustomSubCategory(e.target.value)}
                className='mt-2 w-full min-w-64 rounded-lg border px-3 py-2'
                placeholder='Type new sub category'
                required
              />
            )}
          </div>
          <div className='flex items-end gap-2 pb-1'>
            <input onChange={() => updateForm('bestseller', !formData.bestseller)} checked={formData.bestseller} type='checkbox' id='bestseller' />
            <label className='cursor-pointer text-sm' htmlFor='bestseller'>Mark as bestseller</label>
          </div>
        </div>
      </section>

      <section className='w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-2 text-lg font-semibold text-gray-900'>Pricing & Inventory</h2>
        <p className='mb-4 text-sm text-gray-500'>Set the price, discount, and available stock for this product.</p>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>MRP</p>
            <input onChange={(e) => updateMrp(e.target.value)} value={formData.compareAtPrice} className='w-full rounded-lg border px-3 py-2' type='number' placeholder='0.00' />
            <p className='mt-1 text-xs text-gray-400'>Maximum Retail Price</p>
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Selling Price</p>
            <input onChange={(e) => updateForm('price', e.target.value)} value={formData.price} className='w-full rounded-lg border px-3 py-2' type='number' placeholder='0.00' required />
            <p className='mt-1 text-xs text-gray-400'>Final price the customer will pay</p>
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Discount (%)</p>
            <input onChange={(e) => updateDiscount(e.target.value)} value={discountPercent} className='w-full rounded-lg border px-3 py-2' type='number' placeholder='0' />
            <p className='mt-1 text-xs text-gray-400'>Leave 0 for no discount</p>
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Inventory Quantity</p>
            <input onChange={(e) => updateForm('stockQuantity', e.target.value)} value={formData.stockQuantity} className='w-full rounded-lg border px-3 py-2' type='number' placeholder='Enter quantity' />
            <p className='mt-1 text-xs text-gray-400'>How many items are in stock?</p>
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Cost Per Item</p>
            <input onChange={(e) => updateForm('costPerItem', e.target.value)} value={formData.costPerItem} className='w-full rounded-lg border px-3 py-2' type='number' placeholder='0.00' />
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>SKU</p>
            <input onChange={(e) => updateForm('sku', e.target.value)} value={formData.sku} className='w-full rounded-lg border px-3 py-2' type='text' placeholder='SKU-001' />
          </div>
          <div className='sm:col-span-2'>
            <p className='mb-2 text-sm font-medium text-gray-700'>Backorders</p>
            <label className='flex items-center gap-2 rounded-lg border px-3 py-3 text-sm text-gray-600'>
              <input type='checkbox' checked={formData.allowBackorder} onChange={() => updateForm('allowBackorder', !formData.allowBackorder)} />
              <span>Allow orders when inventory reaches zero</span>
            </label>
          </div>
        </div>
      </section>

      <section className='w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h2 className='mb-2 text-lg font-semibold text-gray-900'>Order Requirements</h2>
        <p className='mb-4 text-sm text-gray-500'>Set minimum order requirements for bulk purchases.</p>
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Minimum Order Quantity</p>
            <input onChange={(e) => updateForm('minimumOrderQuantity', e.target.value)} value={formData.minimumOrderQuantity} className='w-full rounded-lg border px-3 py-2' type='number' min='1' placeholder='1' />
            <p className='mt-1 text-xs text-gray-400'>Leave empty for no minimum.</p>
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Processing Time (Days)</p>
            <input onChange={(e) => updateForm('processingTimeDays', e.target.value)} value={formData.processingTimeDays} className='w-full rounded-lg border px-3 py-2' type='number' min='0' placeholder='0' />
          </div>
          <div>
            <p className='mb-2 text-sm font-medium text-gray-700'>Customization Available</p>
            <label className='flex items-center gap-2 rounded-lg border px-3 py-3 text-sm text-gray-600'>
              <input type='checkbox' checked={formData.customizationAvailable} onChange={() => updateForm('customizationAvailable', !formData.customizationAvailable)} />
              <span>Allow custom requests for this product</span>
            </label>
          </div>
        </div>
        <div className='mt-4 max-w-[700px]'>
          <p className='mb-2 text-sm font-medium text-gray-700'>Order Notes</p>
          <textarea onChange={(e) => updateForm('customizationNotes', e.target.value)} value={formData.customizationNotes} className='min-h-24 w-full rounded-lg border px-3 py-2' placeholder='Mention customization, caution money, dispatch timing, or special requirements' />
        </div>
      </section>

      <section className='w-full rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>Product Variants</h2>
          <p className='mt-1 text-sm text-gray-500'>Add options like size or color to create product variants.</p>
        </div>

        <div>
          <p className='mb-2 text-sm font-medium text-gray-700'>Product Sizes</p>
          <div className='flex flex-wrap gap-3'>
            {sizeOptions.map((size) => (
              <div key={size} onClick={() => toggleSize(size)}>
                <p className={`${formData.sizes.includes(size) ? 'bg-yellow-200' : 'bg-slate-200'} cursor-pointer rounded px-3 py-1 text-sm`}>{size}</p>
              </div>
            ))}
          </div>
        </div>

        <div className='mt-5 flex flex-col gap-4'>
          {formData.productVariants.map((variant, index) => (
            <div key={index} className='rounded-xl border border-gray-200 p-4'>
              <div className='grid gap-3 sm:grid-cols-[1fr_2fr_1fr_auto]'>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-700'>Option name</p>
                  <select
                    value={variant.name}
                    onChange={(e) => updateVariantOption(index, 'name', e.target.value)}
                    className='w-full rounded-lg border px-3 py-2'
                  >
                    {variantNameOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-700'>Option values</p>
                  <div className='flex gap-2'>
                    <input
                      value={variantDrafts[index] || ''}
                      onChange={(e) => updateVariantDraft(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addVariantValues(index)
                        }
                      }}
                      className='w-full rounded-lg border px-3 py-2'
                      placeholder='Type and press Enter'
                    />
                    <button type='button' onClick={() => addVariantValues(index)} className='rounded bg-blue-600 px-4 py-2 text-sm text-white'>
                      Add
                    </button>
                  </div>
                </div>
                <div>
                  <p className='mb-2 text-sm font-medium text-gray-700'>Quantity</p>
                  <input
                    value={variant.quantity || ''}
                    onChange={(e) => updateVariantOption(index, 'quantity', e.target.value)}
                    className='w-full rounded-lg border px-3 py-2'
                    type='number'
                    min='0'
                    placeholder='Enter quantity'
                  />
                </div>
                <div className='flex items-end'>
                  <button type='button' onClick={() => removeVariantOption(index)} className='rounded px-3 py-2 text-sm text-red-500'>
                    Remove
                  </button>
                </div>
              </div>

              {variant.values.length > 0 && (
                <div className='mt-3 flex flex-wrap gap-2'>
                  {variant.values.map((value, valueIndex) => (
                    <span key={`${value}-${valueIndex}`} className='inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700'>
                      {value}
                      <button type='button' onClick={() => removeVariantValue(index, valueIndex)} className='text-red-500'>
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button type='button' onClick={addVariantOption} className='self-start rounded px-2 py-1 text-sm font-medium text-blue-600'>
            + Add another option
          </button>
        </div>
      </section>

      <div className='flex w-full max-w-[700px] items-center justify-between gap-4 pb-8'>
        <button type='button' onClick={() => navigate('/list')} className='rounded-lg border px-6 py-3 text-sm text-gray-600'>
          Cancel
        </button>
        <button type='submit' disabled={loading} className='rounded-lg bg-blue-600 px-8 py-3 text-sm font-semibold text-white disabled:opacity-60'>
          {isEditMode ? 'Save Product' : 'Add Product'}
        </button>
      </div>
    </form>
  )
}

export default Add
