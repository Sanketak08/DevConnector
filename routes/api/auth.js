const express = require('express');
const router = express.Router();
const auth = require( '../../middleware/auth' );
const config = require( 'config' );
const bcrypt = require( 'bcryptjs' );
const jwt = require( 'jsonwebtoken' );
const { check, validationResult } = require( 'express-validator/check' );

const User = require( '../../models/User' );

//@route    GET api/auth
//@desc     Test Route
//@access   Public
router.get("/",auth,async (req,res) => {
    try {
        const user = await User.findById( req.user.id ).select( '-password' );
        res.json( user );
    } catch (err) {
        console.error( err.message );
        res.status( 500 ).send( 'Server Error' );
    }
} );

//@route    POST api/auth
//@desc     Authenticate User & Get Token
//@access   Public
router.post("/", [
    check('email', 'Email is required').isEmail(),
    check('password','Password is required').exists()
],
async ( req, res ) => {
    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        return res.status( 400 ).json( { errors: errors.array() } );
    }
    
    const { email, password } = req.body;

    try {
        //See if User Exists
        let user = await User.findOne( { email } );
        if ( !user ) {
            return res.status( 400 ).json( { errors: [ { msg: "Invalid Credentials" } ] } );
        }

        //Check if password Matches
        const isMatch = await bcrypt.compare( password, user.password );

        if ( !isMatch ) {
            return res.status( 400 ).json( { errors: [ { msg: "Invalid Credentials" } ] } );
        }
        
        //Return jsonwebToken
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign( payload,
            config.get( 'jwtToken' ),
            { expiresIn: 36000 },
            ( err, token ) => {
            if ( err ) {
                throw err;
            } else {
                res.json( { token } );
            }
        } );

    } catch ( err ) {
        console.error( err.message );
        res.status( 500 ).send( "Server Error" );
    }
});

module.exports = router;