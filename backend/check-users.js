process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5433';
process.env.DB_NAME = 'gem_museum';
process.env.DB_USER = 'postgres';
process.env.DB_PASS = '1234';

const { User } = require('./models');

async function check() {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'full_name', 'preferred_language', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    console.log(JSON.stringify(users, null, 2));
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
