module.exports = function(sequelize, DataTypes) {
	return sequelize.define("Event", {
		name		: DataTypes.STRING, 
		occurred	: DataTypes.DATE,  
	})
}