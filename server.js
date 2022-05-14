// node dev-data/data/import-dev-data.js --import
const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', err => {
  console.log('UNHANDLED EXCEPTION: Shutting down...')
  console.log(err.name, err.message)
})

dotenv.config({ path: './config.env' });
const app = require('./app')

const DB = process.env.DATABASE

mongoose
  .connect(DB, {
    useNewUrlParser: true
  })
  .then(() => console.log('DB connection successful!'));

const port = process.env.PORT || 1801;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`); 
});

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION: Shutting down...')
  console.log(err.name, err.message)
  server.close(() => {
    process.exit(1);
  }) // give server time to handle all the incoming requests 
})

