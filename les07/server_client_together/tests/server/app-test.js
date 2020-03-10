const request = require('supertest');
const app = require('../../src/server/app');
const rep = require('../../src/server/repository');

beforeEach(() => {rep.initWithSomeBooks();});

test("Test get all", async () =>{

    /*
        request(app) will start the application on an ephemeral port, if not already started.
        The "get" will do an actual HTTP call toward such running server.
        These tests must be async, as the tests and the backend API are running on the same
        event-loop thread
     */

    const response = await request(app).get('/api/books');

    expect(response.statusCode).toBe(200);
    expect(response.body.length).toBe(5);
});


test("Test not found book", async () => {

    const response = await request(app).get('/api/books/-3');
    expect(response.statusCode).toBe(404);
});


test("Test retrieve each single book", async () => {

    const responseAll = await request(app).get('/api/books');
    expect(responseAll.statusCode).toBe(200);

    const books = responseAll.body;
    expect(books.length).toBe(5);

    for(let i=0; i<books.length; i++){

        const res = await request(app).get('/api/books/'+books[i].id);
        const book = res.body;

        expect(book.title).toBe(books[i].title)
    }
});


test("Test create book", async () => {

    let responseAll = await request(app).get('/api/books');
    const n = responseAll.body.length;

    const title = "foo";

    const resPost = await request(app)
        .post('/api/books')
        .send({title:title, author:"bar", year: 2018})
        .set('Content-Type', 'application/json');

    expect(resPost.statusCode).toBe(201);
    const location = resPost.header.location;

    //should had been increased by 1
    responseAll = await request(app).get('/api/books');
    expect(responseAll.body.length).toBe(n + 1);

    const resGet = await request(app).get(location);
    expect(resGet.statusCode).toBe(200);
    expect(resGet.body.title).toBe(title);
});


test("Delete all books", async () =>{

    let responseAll = await request(app).get('/api/books');
    expect(responseAll.statusCode).toBe(200);

    const books = responseAll.body;
    expect(books.length).toBe(5);

    for(let i=0; i<books.length; i++){

        const res = await request(app).delete('/api/books/'+books[i].id);
        expect(res.statusCode).toBe(204);
    }

    responseAll = await request(app).get('/api/books');
    expect(responseAll.statusCode).toBe(200);
    expect(responseAll.body.length).toBe(0);
});


test("Update book", async () => {

    const title = "foo";

    //create a book
    const resPost = await request(app)
        .post('/api/books')
        .send({title:title, author:"bar", year: 2018})
        .set('Content-Type', 'application/json');
    expect(resPost.statusCode).toBe(201);
    const location = resPost.header.location;


    //get it back
    let resGet = await request(app).get(location);
    expect(resGet.statusCode).toBe(200);
    expect(resGet.body.title).toBe(title);


    const modified = "bar";
    const id = location.substring(location.lastIndexOf("/")+1, location.length);

    //modify it with PUT
    const resPut = await request(app)
        .put(location)
        .send({id:id, title:modified, author:"bar", year: 2018})
        .set('Content-Type', 'application/json');
    expect(resPut.statusCode).toBe(204);

    //get it back again to verify the change
    resGet = await request(app).get(location);
    expect(resGet.statusCode).toBe(200);
    expect(resGet.body.title).toBe(modified);
});