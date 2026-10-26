const { createServer } = require('./app');

const port = process.env.PORT || 3000;

createServer().listen(port, () => {
  console.log(`Hospital appointment booking running at http://localhost:${port}`);
});
