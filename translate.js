const mongoose = require('mongoose');

const Schema = mongoose.Schema({
	translate: String,
	slug: String,
	lang: String
});

module.exports = mongoose.model('Translate', Schema);
