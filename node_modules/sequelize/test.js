var Support = require('./test/support');
var sequelize = Support.createSequelizeInstance({ dialect: 'mysql' })


sequelize.query('SELECT * FROM Users;').success(console.log);