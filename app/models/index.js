if (!global.hasOwnProperty('db')) {
  var Sequelize = require('sequelize');

  var sequelize = new Sequelize('test', 'root', 'itllbeok', {
    host          : 'localhost',
    dialect       : 'mysql', 
    dialectOptions: {
      // Necessary for XAMPP-specific local development - Update with the path to your mysql socket (XAMPP_DIR/etc/my.conf)
      socketPath: '/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock' 
    }
  })


  global.db = {
    Sequelize:          Sequelize,
    sequelize:          sequelize,
    Event:              sequelize.import(__dirname + '/event'), 
    EventType:          sequelize.import(__dirname + '/eventType'),
    EventAttrValueChar: sequelize.import(__dirname + '/eventAttrValueChar'),
    EventAttrValueInt:  sequelize.import(__dirname + '/eventAttrValueInt'), 
  }

  /*
    Associations can be defined here. e.g. like this:
    global.db.User.hasMany(global.db.SomethingElse)
  */
  global.db.Event
              .hasMany(global.db.EventAttrValueInt)
              .hasMany(global.db.EventAttrValueChar);

  global.db.EventType
              .hasMany(global.db.Event);

}

module.exports = global.db;