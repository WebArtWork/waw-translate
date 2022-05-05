var mongoose = require('mongoose');
var Schema = mongoose.Schema({
	slug: String,
	word: String,
	page: String,
	description: String
});
module.exports = mongoose.model('Word', Schema);