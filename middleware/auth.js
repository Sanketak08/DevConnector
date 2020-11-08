const { JsonWebTokenError } = require( "jsonwebtoken" );

const jwt = require( 'jsonwebtoken' );
const config = require( 'config' );


module.exports = function ( req, res, next ) {
    // To get the token
    const token = req.header( 'x-auth-token' );

    //Check if not token
    if ( !token ) {
        return res.status( 401 ).json( { msg: 'No Token,Authorization Denied!' } );
    }

    //Verify Token
    try {
        const decoded = jwt.verify( token, config.get( 'jwtToken' ) );
        req.user = decoded.user;

        next();
    } catch (err) {
        res.status( 401 ).json( { msg: 'Token not valid!' } );
    }
}