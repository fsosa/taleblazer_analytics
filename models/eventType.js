module.exports = function(sequelize, DataTypes) {
	return sequelize.define("EventType", {
		name		: DataTypes.STRING, 
	})
}