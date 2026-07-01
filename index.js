require('dotenv').config()

const express = require('express')
const routes = require('./routes/routes')
const cors = require('cors')

const app=express()

require('./Connection/connection')

app.use(cors())

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.path} => body:`, req.body)
    next()
})

app.use(routes)

app.use('/uploads', express.static('./uploads'))

const PORT=process.env.PORT || 3000

app.listen(PORT,(error)=>{
    if(error){
        console.log(error)
    }
    else{
        console.log(`Server running at http://localhost:${PORT}`)
    }
})