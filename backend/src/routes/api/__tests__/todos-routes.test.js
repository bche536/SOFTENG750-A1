import routes from '../todos-routes';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import axios from 'axios';
import connectToDatabase from '../../../db/db-connect';
import { Todo } from '../../../db/todos-schema';
import dayjs from 'dayjs';
import nock from 'nock';
import jwt from 'jsonwebtoken';


let mongod, app, server;

const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEArhb4BLgVe/MFQALQujqgC+i1tOLVl31dql0HVc/WghrQax5x
TbJiP453QiDPW1B3oeEvbCkIftAUgF7uk2PZTPJqoc2mpH8aUqi6EOUsVarnPHZk
vjjJFzUtWx9sxBGQeakj/rvSrlpJKE8n0IBWtyoKd0d8OUg7g1NrBXaajPYkYyFM
L87njFDb0L58jp61xYGs0eIR4aGMMRG78mC0rtdidcbTlnwOIaBeU8SMfPBgeuDF
2JW7F0IUMbRujUVbOjJMsoBS4LA9vnOGMQPcfu3Le7GnaloOCcMK9avJDQOTAJ5o
y9WjR1rI52vDBPyRDNFyo0v8HkBgLR9iG2qsTwIDAQABAoIBABga6ROqM5tajo8K
9MDcjj2n5sUZpY6Y1sfYosPgh+iy8snqSLED8rOvM9ctuNiBf1ckWY8l7V21zSjr
PCifaj7L0DUAR0M+sDPi1gSx3t4r0GHgWNm3/iwe+l1EMCjD79fQskG62xS2Pqv8
rdwicR9ijFlwxgQeetMX0VlLz2GWFwQT5lMfZE+9ldEF5gt2jl/BVHN2G1O1VMcj
R3Btqqe+Hh/7OACwMSaE7i8HJxbD5iiL4M1Iogvkf+NrazQgaBXlgj17d4rHM58P
RaUz+tYK8E3dM0xO6osMGdi0ugqg1/lOgR64YGRG4SWWI6aZZYpAuILxuz8TLYCi
ws71KRkCgYEA0gndfDQfPWpxi3U4LKeZRntykUpBbtyFmS+/2CtjfmkZ87yY5uFP
nOJJuv1q/nQGESxYsutLFqKB7ZGcMECLHOGeyL+P5b/WwhCbtV9SOO9DWA//Ewms
y3vM9UWR5yFE7seFNDKozDyYv6LbvjRZb1DYHpLasUnZKjNqwwohzykCgYEA1C9K
F5TzNBDdMku01HvJ5nGFNOzuZ/rOx1XlBYo4ROqcalVxsA6N7gSzIsugkpCjavu0
B+RShJ6LNIWC58aKBmxkSVdOyocbdQrJc1fKfdtOP2776MjTUhmLeoiE5MY2mwWk
cUmtR/ro7VcIXCKaTD5xLM3YBFmlPpXCzIXzprcCgYAqMTsh0SKZZsGKXzC6n6xF
oVTBZOZCC+B2hkYGeajR4vEIqlEYyBgDDt36xx9wIAR7/KmQv31k/Z4WCBMVClIn
qhcIgpq4b1IHx+hPhedxcnbXwNbfjyj781GXz7LgeCltwfy7IJYR+PZCQMfdrIxu
tRHFCoEN7iTGum9u4KEsCQKBgQDRGJT0LjWIfoHsWYymxCJPtFjnsgCyeQeiijO5
xN70kxp28yKos38MKpd5V58yL9TKzaY5DLiAtlhJ9rPswcssz034tFAR5xiYu3uP
7di/NAmlGzKl0Jnm0wOPSc9kPyx6khHeDhPz1gAKO3UijnrtXa9bzrHsf4cG6MBh
mjNkewKBgAv/aE1aj+2hB1n/4QhMLoZs2jNo8OL0yFnr/AZ54y1pSwpuueBHXWuc
BExVD2ke7LGoniR2qo3sVgPeGa+WPb0wpGCxwZrVbYuhEBXMIuTNtIOWOYISc9Mr
3ZiIomnc+9f6YBgwY3/ZmuZnvbdS/Xe3EfQHdAwRf0jnKrEwne+z
-----END RSA PRIVATE KEY-----`

const nockReply = {
    keys: [{
      alg: 'RS256',
      kty: 'RSA',
      use: 'sig',
      n: 'rhb4BLgVe_MFQALQujqgC-i1tOLVl31dql0HVc_WghrQax5xTbJiP453QiDPW1B3oeEvbCkIftAUgF7uk2PZTPJqoc2mpH8aUqi6EOUsVarnPHZkvjjJFzUtWx9sxBGQeakj_rvSrlpJKE8n0IBWtyoKd0d8OUg7g1NrBXaajPYkYyFML87njFDb0L58jp61xYGs0eIR4aGMMRG78mC0rtdidcbTlnwOIaBeU8SMfPBgeuDF2JW7F0IUMbRujUVbOjJMsoBS4LA9vnOGMQPcfu3Le7GnaloOCcMK9avJDQOTAJ5oy9WjR1rI52vDBPyRDNFyo0v8HkBgLR9iG2qsTw',
      e: 'AQAB',
      kid: '0',
    }]
}

require("dotenv").config();
const domain = process.env.EXPRESS_AUTH0_DOMAIN
const audience = process.env.EXPRESS_AUTH0_AUDIENCE

nock(`https://${domain}`)
  .persist()
  .get('/.well-known/jwks.json')
  .reply(200, nockReply)

const getToken = (email) => {  
    // A real payload will generally have a lot of stuff in it
    // these fields are common but it doesn't really matter.
    const payload = {
      email: email,
      sub: email,
    }
    
    const options = {
      header: { kid: '0' }, // Needs to match the `kid` in our jwks.json mock 
      algorithm: 'RS256', // Needs to match our expressJwt instance
      expiresIn: '1d',
      audience: audience, // Needs to match our expressJwt instance
      issuer: `https://${domain}/`, // Needs to match our expressJwt instance
    }
  
    let token
    try {
      token = jwt.sign(payload, privateKey, options)
    }
    catch(err) {
      console.log(err)
      throw err
    }
  
    return token
  }
  
  module.exports = {
    getToken
  }


jest.setTimeout(10000);

// Some dummy data to test with
const overdueTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000002'),
    title: 'OverdueTitle',
    description: 'OverdueDesc',
    isComplete: false,
    dueDate: dayjs().subtract(1, 'day').format(),
};

const upcomingTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
    title: 'UpcomingTitle',
    description: 'UpcomingDesc',
    isComplete: false,
    dueDate: dayjs().add(1, 'day').format(),
};

const completeTodo = {
    _id: new mongoose.mongo.ObjectId('000000000000000000000004'),
    title: 'CompleteTitle',
    description: 'CompleteDesc',
    isComplete: true,
    dueDate: dayjs().format(),
}

const dummyTodos = [overdueTodo, upcomingTodo, completeTodo];

let accessToken;
// Start database and server before any tests run
beforeAll(async done => {
    mongod = new MongoMemoryServer();
    
    await mongod.getUri()
    .then(cs => connectToDatabase(cs));
    
    accessToken = getToken('hello@yoza.com');
    app = express();
    app.use(express.json());
    app.use('/api/todos', routes);
    server = app.listen(3000, done);
});

// Populate database with dummy data before each test
beforeEach(async () => {
    for (let i = 0; i < dummyTodos.length; i++) {
        await axios.post('http://localhost:3000/api/todos', dummyTodos[i], {
          headers: {
              Authorization: `Bearer ${accessToken}`
          }
        })
    }
});

// Clear database after each test
afterEach(async () => {
    await Todo.deleteMany({});
});

// Stop db and server before we finish
afterAll(done => {
    server.close(async () => {
        await mongoose.disconnect();
        await mongod.stop();
        done();
    });
});

it('retrieves all todos successfully', async () => {
    const response = await axios.get('http://localhost:3000/api/todos', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
    expect(response.status).toBe(200);
    const responseTodos = response.data;
    expect(responseTodos.length).toBe(3);

    for (let i = 0; i < responseTodos.length; i++) {
        const responseTodo = responseTodos[i];
        const expectedTodo = dummyTodos[i];

        expect(responseTodo._id.toString()).toEqual(expectedTodo._id.toString());
        expect(responseTodo.title).toEqual(expectedTodo.title);
        expect(responseTodo.description).toEqual(expectedTodo.description);
        expect(responseTodo.isComplete).toEqual(expectedTodo.isComplete);
        expect(dayjs(responseTodo.dueDate)).toEqual(dayjs(expectedTodo.dueDate));
    }
});

it('retrieves a single todo successfully', async () => {
    const response = await axios.get('http://localhost:3000/api/todos/000000000000000000000003', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
    expect(response.status).toBe(200);

    const responseTodo = response.data;
    expect(responseTodo._id.toString()).toEqual(upcomingTodo._id.toString());
    expect(responseTodo.title).toEqual(upcomingTodo.title);
    expect(responseTodo.description).toEqual(upcomingTodo.description);
    expect(responseTodo.isComplete).toEqual(upcomingTodo.isComplete);
    expect(dayjs(responseTodo.dueDate)).toEqual(dayjs(upcomingTodo.dueDate));
});

it('returns a 404 when attempting to retrieve a nonexistant todo (valid id)', async () => {
    try {
        await axios.get('http://localhost:3000/api/todos/000000000000000000000001', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        fail('Should have thrown an exception.');
    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(404);
    }
});

it('returns a 400 when attempting to retrieve a nonexistant todo (invalid id)', async () => {
    try {
        await axios.get('http://localhost:3000/api/todos/blah', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        fail('Should have thrown an exception.');
    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(400);
        expect(response.data).toBe('Invalid ID');
    }
});

it('Creates a new todo', async () => {

    const newTodo = {
        title: 'NewTodo',
        description: 'NewDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.post('http://localhost:3000/api/todos', newTodo, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

    // Check response is as expected
    expect(response.status).toBe(201);
    expect(response.data).toBeDefined();
    const rTodo = response.data;
    expect(rTodo.title).toBe('NewTodo');
    expect(rTodo.description).toBe('NewDesc');
    expect(rTodo.isComplete).toBe(false);
    expect(dayjs(rTodo.dueDate)).toEqual(dayjs('2100-01-01'));
    expect(rTodo._id).toBeDefined();
    expect(response.headers.location).toBe(`/api/todos/${rTodo._id}`);

    // Check that the todo was actually added to the database
    const dbTodo = await Todo.findById(rTodo._id);
    expect(dbTodo.title).toBe('NewTodo');
    expect(dbTodo.description).toBe('NewDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));

});

it('Gives a 400 when trying to create a todo with no title', async () => {
    try {

        const newTodo = {
            description: 'NewDesc',
            isComplete: false,
            dueDate: dayjs('2100-01-01').format()
        }

        await axios.post('http://localhost:3000/api/todos', newTodo, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        fail('Should have thrown an exception.');
    } catch (err) {

        // Ensure response is as expected
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(400);

        // Ensure DB wasn't modified
        expect(await Todo.countDocuments()).toBe(3);
    }
})

it('updates a todo successfully', async () => {

    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000004'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.put('http://localhost:3000/api/todos/000000000000000000000004', toUpdate, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

    // Check response
    expect(response.status).toBe(204);

    // Ensure DB was updated
    const dbTodo = await Todo.findById('000000000000000000000004');
    expect(dbTodo.title).toBe('UPDCompleteTitle');
    expect(dbTodo.description).toBe('UPDCompleteDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));


})

it('Uses the path ID instead of the body ID when updating', async () => {

    const toUpdate = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000003'),
        title: 'UPDCompleteTitle',
        description: 'UPDCompleteDesc',
        isComplete: false,
        dueDate: dayjs('2100-01-01').format()
    }

    const response = await axios.put('http://localhost:3000/api/todos/000000000000000000000004', toUpdate, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });

    // Check response
    expect(response.status).toBe(204);

    // Ensure correct DB entry was updated
    let dbTodo = await Todo.findById('000000000000000000000004');
    expect(dbTodo.title).toBe('UPDCompleteTitle');
    expect(dbTodo.description).toBe('UPDCompleteDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs('2100-01-01'));

    // Ensure incorrect DB entry was not updated
    dbTodo = await Todo.findById('000000000000000000000003');
    expect(dbTodo.title).toBe('UpcomingTitle');
    expect(dbTodo.description).toBe('UpcomingDesc');
    expect(dbTodo.isComplete).toBe(false);
    expect(dayjs(dbTodo.dueDate)).toEqual(dayjs(upcomingTodo.dueDate));
})

it('Gives a 404 when updating a nonexistant todo', async () => {

    try {
        const toUpdate = {
            _id: new mongoose.mongo.ObjectId('000000000000000000000010'),
            title: 'UPDCompleteTitle',
            description: 'UPDCompleteDesc',
            isComplete: false,
            dueDate: dayjs('2100-01-01').format()
        }

        await axios.put('http://localhost:3000/api/todos/000000000000000000000010', toUpdate, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            }
          });
        fail('Should have returned a 404');

    } catch (err) {
        const { response } = err;
        expect(response).toBeDefined();
        expect(response.status).toBe(404);

        // Make sure something wasn't added to the db
        expect(await Todo.countDocuments()).toBe(3);
    }

})

it('Deletes a todo', async () => {

    const response = await axios.delete('http://localhost:3000/api/todos/000000000000000000000003', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
    expect(response.status).toBe(204);

    // Check db item was deleted
    expect(await Todo.findById('000000000000000000000003')).toBeNull();

})

it('Doesn\'t delete anything when it shouldn\'t', async () => {

    const response = await axios.delete('http://localhost:3000/api/todos/000000000000000000000010', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        }
      });
    expect(response.status).toBe(204);

    // Make sure something wasn't deleted from the db
    expect(await Todo.countDocuments()).toBe(3);
})

// 5 tests


it('Returns 401 when an unauthorised user tries to GET a list of todos', async () => {
    try {
      await axios.get('http://localhost:3000/api/todos');
    } catch (err) {
      const { response } = err;
      expect(response.status).toBe(401);
    }
});

it('Returns 401 when an unauthorised user tries to POST a todo', async () => {
    const todo = {
        title: 'Do the stuff',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
        isComplete: true,
        dueDate: dayjs().add(2, 'day').toDate()
    }
  
    try {
      await axios.post('http://localhost:3000/api/todos', todo);
    } catch (err) {
      const { response } = err;
      expect(response.status).toBe(401);
  
      // Check nothing changed
      expect(await Todo.countDocuments()).toBe(3);
    }
});

it('Returns 401 when an unauthorised user tries to GET a single todo', async () => {
    try {
      await axios.get('http://localhost:3000/api/todos/000000000000000000000002');
    } catch (err) {
      const { response } = err;
      expect(response.status).toBe(401);
    }
});

it('Returns 401 when a user tries to GET a todo that is not theirs', async () => {  
    try {
      await axios.get('http://localhost:3000/api/todos/000000000000000000000002', {
        headers: {
          Authorization: `Bearer ${123456}`,
        }
      });
    } catch (err) {
      const { response } = err;
      expect(response.status).toBe(401);
    }
});

it('Returns 401 when a user tries to DELETE a todo that is not theirs', async () => {  
    try {
      await axios.delete('http://localhost:3000/api/todos/000000000000000000000003', {
        headers: {
          Authorization: `Bearer ${123456}`,
        }
      });
    } catch (err) {
        console.log(err)
      const { response } = err;
      expect(response.status).toBe(401);

      // Check db isn't modified
      let todoDB = await Todo.findById('000000000000000000000003');
      expect(todoDB).toBeDefined; 
    }

});

// //3 tests

//GET
it('Returns 401 when an unauthorised user tries GET a todo that doesnt belong to them', async () => {
    const todo = {
        _id: new mongoose.mongo.ObjectId('000000010100000009000002'),
        title: 'bye',
        description: 'hello',
        isComplete: false,
        dueDate: dayjs().add(1, 'day').format(),
    }
    
    try {
        await axios.get('http://localhost:3000/api/todos/000000010100000009000002', todo);
    } catch (err) {
        const { response } = err;
        expect(response.status).toBe(401);
    }
});


//PUT
it('Returns 401 when an unauthorised user tries PUT a todo that doesnt belong to them', async () => {
    const todo = {
        _id: new mongoose.mongo.ObjectId('000000000000000000000004'),
        title: 'UpcomingTitle',
        description: 'UpcomingDesc',
        isComplete: false,
        dueDate: dayjs().add(1, 'day').format(),
    }
    
    try {
        await axios.put('http://localhost:3000/api/todos/000000000000000000000004', todo);
    } catch (err) {
        const { response } = err;
        expect(response.status).toBe(401);
        
        // Check db isn't modified
        let todoDB = await Todo.findById('000000000000000000000004');
        expect(todoDB.title).toBe('CompleteTitle');
        expect(todoDB.description).toBe('CompleteDesc');
        expect(todoDB.isComplete).toBe(true);
        expect(dayjs(todoDB.dueDate)).toEqual(dayjs(dummyTodos[2].dueDate));
    }
});


//DELETE
it('Returns 401 when an unauthorised user tries DELETE a todo', async () => {
    try {
        await axios.delete('http://localhost:3000/api/todos/000000000100000000000002');
    } catch (err) {
        const { response } = err;
        expect(response.status).toBe(401);
        
        // Check db isn't modified
        let todoDB = await Todo.findById('000000000000000000000002');
        expect(todoDB).toBeDefined;
        expect(await Todo.countDocuments()).toBe(3);
    }
});
