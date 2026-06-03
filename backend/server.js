require('dotenv').config();
const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await sequelize.authenticate();
    console.log('DB connected');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    require('./models');
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
