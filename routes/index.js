const route = require('express').Router()

route.get('/', (req, res) => {
    res.send('Home Page')
})

const userRoutes = require('./User/userRoutes')
const productRoutes = require('./Product/productRoutes')

route.use('/user', userRoutes)
route.use('/product', productRoutes)

module.exports = route