import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import userRouter from './routes/userRoute.js'
import productRouter from './routes/productRoute.js'
import cartRouter from './routes/cartRoute.js'
import orderRouter from './routes/orderRoute.js'

//App Config
const app = express()
const port = process.env.PORT || 4000

const configuredOrigins = new Set(
    (process.env.CORS_ORIGINS || '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
)

const trustedOriginPatterns = [
    /^http:\/\/localhost:\d+$/,
    /^https?:\/\/(www\.)?anantacraze\.com$/,
    /^https?:\/\/admin\.anantacraze\.com$/
]

const isAllowedOrigin = (origin) => {
    if (!origin) {
        return true
    }

    if (configuredOrigins.has(origin)) {
        return true
    }

    return trustedOriginPatterns.some((pattern) => pattern.test(origin))
}

const corsOptions = {
    origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed by CORS'))
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true
}

connectDB()
connectCloudinary()

// middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors(corsOptions))
app.options(/.*/, cors(corsOptions))

//API endpoints
app.use('/api/user', userRouter)
app.use('/api/product',productRouter);
app.use('/api/cart',cartRouter)
app.use('/api/order',orderRouter)

app.get('/',(req,res)=>{
    res.send("API Working")
})

app.listen(port, () => console.log('Server started on PORT:'+ port))
