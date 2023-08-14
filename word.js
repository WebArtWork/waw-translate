const mongoose = require('mongoose');

const Schema = mongoose.Schema({
	slug: String,
	word: String,
	page: String,
	description: String
});

module.exports = mongoose.model('Word', Schema);
