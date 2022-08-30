const Translates = require(__dirname + '/translate.js');
const Word = require(__dirname + '/word.js');

module.exports = async waw => {
	const router = waw.router('/api/translate');

	router.get('/get', waw.role('admin'), async (req, res) => {
		// TODO make this management into files, each language different file
		const translates = await Translates.find({});
		const obj = {};
		for (var i = 0; i < translates.length; i++) {
			if (!obj[translates[i].lang]) obj[translates[i].lang] = {};
			obj[translates[i].lang][translates[i].slug] = translates[i].translate;
		}
		res.json(obj);
	});

	router.post('/create', waw.role('admin'), async (req, res) => {
		const translate = await Translates.findOne({
			slug: req.body.slug,
			lang: req.body.lang
		});
		if (translate) {
			translate.translate = req.body.translate;
			translate.save(function () {
				res.json(true);
			});
		} else {
			await Translates.create(req.body);
			res.json(true);
		}
	});

	router.post('/delete', waw.role('admin'), async (req, res) => {
		await Translates.deleteMany({
			slug: req.body.slug
		});
		res.json(true);
	});

	const routerWord = waw.router('/api/word');

	routerWord.get('/get', waw.role('admin'), async (req, res) => {
		const words = await Word.find({});
		res.json(words || []);
	});

	routerWord.post('/create', waw.role('admin'), async (req, res) => {
		const word = await Word.findOne({
			slug: req.body.slug
		});
		if (word) {
			res.json(false);
		} else {
			res.json(await Word.create(req.body));
		}
	});

	routerWord.post('/delete', waw.role('admin'), async (req, res) => {
		await Word.deleteOne({
			_id: req.body._id
		});
		res.json(true);
	});
};
