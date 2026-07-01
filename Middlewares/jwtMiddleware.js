const jwt = require('jsonwebtoken')

const jwtMiddleware = (req, res, next) => {
    try {
        console.log("Request Hit at JWT Middleware")
        const token = req.headers['authorization']?.split(" ")[1]
        if (token) {
            const jwtResponse = jwt.verify(token, process.env.SECRET_KEY)
            req.payload = jwtResponse.userId
            next()
        } else {
            res.status(401).json("Please login!!")
        }
    } catch (err) {
        console.log(err)
        res.status(401).json("Invalid Token / Please Login!!")
    }
}

module.exports = jwtMiddleware