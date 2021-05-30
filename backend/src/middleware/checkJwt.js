import jwt from 'express-jwt';
import jwksRsa from 'jwks-rsa';
require("dotenv").config();

const domain = process.env.EXPRESS_AUTH0_DOMAIN
// const audience = process.env.EXPRESS_AUTH0_AUDIENCE

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${domain}/.well-known/jwks.json`
    }),
  
    audience: process.env.EXPRESS_AUTH0_AUDIENCE,
    issuer: `https://${domain}/`,
    algorithms: ['RS256']
  });

  export default checkJwt;