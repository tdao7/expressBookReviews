const express = require('express');
const axios = require('axios');
const crypto = require('node:crypto');
const books = require('./booksdb');
const { isValid, users, hashPassword } = require('./auth_users');
const public_users = express.Router();

public_users.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== 'string' || !username.trim() ||
      typeof password !== 'string' || !password.trim()) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const cleanedUsername = username.trim();
  if (isValid(cleanedUsername)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const salt = crypto.randomBytes(16).toString('hex');
  users.push({ username: cleanedUsername, salt, passwordHash: hashPassword(password, salt) });
  return res.status(201).json({ message: 'User successfully registered' });
});

public_users.get('/', (req, res) => res.status(200).json(books));

public_users.get('/isbn/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book)
              : res.status(404).json({ message: 'Book not found' });
});

public_users.get('/author/:author', (req, res) => {
  const wanted = req.params.author.toLocaleLowerCase();
  const matches = Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.author.toLocaleLowerCase().includes(wanted)));
  return res.status(200).json(matches);
});

public_users.get('/title/:title', (req, res) => {
  const wanted = req.params.title.toLocaleLowerCase();
  const matches = Object.fromEntries(Object.entries(books).filter(([, book]) =>
    book.title.toLocaleLowerCase().includes(wanted)));
  return res.status(200).json(matches);
});

public_users.get('/review/:isbn', (req, res) => {
  const book = books[req.params.isbn];
  return book ? res.status(200).json(book.reviews)
              : res.status(404).json({ message: 'Book not found' });
});

// Task 11: four independent Axios clients using Promises and async/await.
// Error cases are handled explicitly; callers can catch the rethrown error.
const BASE_URL = process.env.BOOKS_API_URL || 'http://localhost:5000';

function getAllBooks() {
  return axios.get(`${BASE_URL}/`)
    .then((response) => response.data)
    .catch((error) => {
      console.error('Failed to retrieve all books:', error.message);
      throw error;
    });
}

async function getBooksByISBN(isbn) {
  try {
    const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to retrieve ISBN ${isbn}:`, error.message);
    throw error;
  }
}

async function getBooksByAuthor(author) {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to retrieve author ${author}:`, error.message);
    throw error;
  }
}

async function getBooksByTitle(title) {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to retrieve title ${title}:`, error.message);
    throw error;
  }
}

module.exports = {
  general: public_users,
  getAllBooks,
  getBooksByISBN,
  getBooksByAuthor,
  getBooksByTitle
};
