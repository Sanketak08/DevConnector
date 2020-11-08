const express = require('express');
const router = express.Router();
const { check, validationResult } = require( 'express-validator/check' );
const gravatar = require( 'gravatar' );
const bcrypt = require( 'bcryptjs' );
const config = require( 'config' );
const jwt = require( 'jsonwebtoken' );

const User = require( '../../models/User' );

//@route    POST api/users
//@desc     Register User
//@access   Public
router.post("/", [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Email is required').isEmail(),
    check('password','Password of minimum 6 characters is required').isLength({min:6})
],
async ( req, res ) => {
    const errors = validationResult( req );
    if ( !errors.isEmpty() ) {
        return res.status( 400 ).json( { errors: errors.array() } );
    }
    
    const { name, email, password } = req.body;

    try {
        //See if User Exists
        let user = await User.findOne( { email } );
        if ( user ) {
            return res.status( 400 ).json( { errors: [ { msg: "User Already Exists!" } ] } );
        }
        
        //Get Users Gravatar
        const avatar = gravatar.url( email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        } );

        user = new User( {
            name,
            email,
            avatar,
            password
        } );
        
        //Encrypt Password
        const salt = await bcrypt.genSalt( 10 );
        user.password = await bcrypt.hash( password, salt );

        await user.save();
        
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