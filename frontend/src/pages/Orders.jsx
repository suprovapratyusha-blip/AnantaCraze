import React, {useContext, useEffect, useState} from 'react'
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import axios from 'axios';

const Orders = () => {

  const { backendUrl, token , currency } = useContext (ShopContext);

  const [orderData,setOrderData] = useState([])

  const loadOrderData = async () => {
    try {
        if (!token) {
            return null
        }

        const response = await axios.post(backendUrl +'/api/order/userOrders',{},{headers: {token}})
        if (response.data.success) {
            let allOrdersItems = []
            response.data.orders.map((order)=>{
                order.items.map((item)=>{
                    item['status'] = order.status
                    item['payment'] = order.payment
                    item['paymentMethod'] = order.paymentMethod
                    item['paymentStatus'] = order.paymentStatus
                    item['advancePaymentAmount'] = order.advancePaymentAmount
                    item['cashOnDeliveryAmount'] = order.cashOnDeliveryAmount
                    item['date'] = order.date
                    allOrdersItems.push(item)
                })
            })
            setOrderData(allOrdersItems.reverse())
            
        }
        
    } catch (error) {
        
    }
  }

  useEffect(()=>{
    loadOrderData()
  },[token])

  return (
    <div className='border-t pt-16'>
        <div className='text-2xl'>
            <Title text1={'MY'} text2={'ORDERS'}/>

        </div>

        <div>
            {
                orderData.map((item,index)=>(
                    <div key={index} className='py-4 border-t border-b text-gray-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
                        <div className='flex items-start gap-6 text-sm'>
                            <img className='w-16 sm:w-20' src={item.image[0]} alt="" />
                            <div>
                                <p className='sm:text-base font-medium'>{item.name}</p>
                                <div className='flex items-center gap-3 mt-1 text-base text-gray-700'>
                                    <p className='text-lg'> {currency} {item.price}</p>
                                    <p>Quantity: {item.quantity}</p>
                                    <p>Size: {item.size}</p>
                                </div>
                                <p className='mt-1'>Date: <span className='text-gray-400'>{new Date(item.date).toDateString()}</span></p>
                                <p className='mt-1'>Payment Method: <span className='text-gray-400'>{item.paymentMethod}</span></p>
                                <p className='mt-1'>Payment Status: <span className='text-gray-400'>{item.paymentStatus || (item.payment ? 'Done' : 'Pending')}</span></p>
                                {item.paymentMethod === 'COD' && (
                                    <p className='mt-1'>
                                        Paid Now: <span className='text-gray-400'>{currency} {item.advancePaymentAmount ?? 0}</span>
                                        {' '}| Due on Delivery: <span className='text-gray-400'>{currency} {item.cashOnDeliveryAmount ?? 0}</span>
                                    </p>
                                )}
                                
                            </div>
                        </div>
                        <div className='md:w-1/2 flex justify-between'>
                            <div className='flex items-center gap-2'>
                                 <p className='min-w-2 h-2 rounded-full bg-green-500'></p>
                                 <p className='text-sm md:text-base'>{item.status}</p>
                            </div>
                            <button onClick={loadOrderData} className='border px-4 py-2 text-sm font-medium rounded-sm'>Track Order</button>

                        </div>
                    </div>
                ))
            }
        </div>
      
    </div>
  )
}

export default Orders
