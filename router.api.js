const geoip = require("geoip-lite");
module.exports = async waw => {
	const TranslateSchema = waw.mongoose.Schema({
		translate: String,
		slug: String,
		lang: String
	});

	const Translates = waw.mongoose.model('Translate', TranslateSchema);

	const WordSchema = waw.mongoose.Schema({
		slug: String,
		word: String,
		page: String,
		description: String
	});

	const Word = waw.mongoose.model('Word', WordSchema);

	const routerTranslate = waw.router('/api/translate');

	waw.translate = (req) => {
		return (obj)=>{}
	};

	waw.translates = async (lang) => {
		const translates = await Translates.find({
			lang
		});

		const obj = {};

		for (var i = 0; i < translates.length; i++) {
			obj[translates[i].slug] = translates[i].translate;
		}

		return obj;
	}

	const translates = {
		uk: await waw.translates("uk"),
		en: await waw.translates("en"),
		fr: await waw.translates("fr")
	}

	routerTranslate.post('/set', (req, res)=>{
		req.session.language = req.body.language;
		res.json(true);
	})

	waw.translate = (req) => {
		let lang = req.session.language ? req.session.language : 'en';
		if (!req.session.language) {
			const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

			const geo = geoip.lookup(ip);

			if (geo && geo.country === "UA") {
				lang = 'uk';
			}
		}

		if (!translates[lang]) {
			translates[lang] = {};
		}

		return (obj) => {
			obj.translate = (slug) => {
				const word = slug.split('.').slice(1).join('.');

				if (typeof translates[lang][slug] !== 'string') {
					waw.word(slug);
				}

				return lang ? translates[lang][slug] || word : word;
			};
		}
	}

	routerTranslate.get('/get', async (req, res) => {
		const translates = await Translates.find({});

		const obj = {};

		for (var i = 0; i < translates.length; i++) {
			if (!obj[translates[i].lang]) obj[translates[i].lang] = {};

			obj[translates[i].lang][translates[i].slug] = translates[i].translate;
		}

		res.json(obj);
	});

	routerTranslate.post('/create', waw.role('admin'), async (req, res) => {
		const translate = await Translates.findOne({
			slug: req.body.slug,
			lang: req.body.lang
		});

		translates[req.body.lang][req.body.slug] = req.body.translate;

		if (translate) {
			translate.translate = req.body.translate;

			await translate.save()
				res.json(true);
		} else {
			await Translates.create(req.body);

			res.json(true);
		}
	});

	routerTranslate.post('/delete', waw.role('admin'), async (req, res) => {
		await Translates.deleteMany({
			slug: req.body.slug
		});

		res.json(true);
	});

	const routerWord = waw.router('/api/word');

	routerWord.get('/get', async (req, res) => {
		const words = await Word.find({});

		res.json(words || []);
	});

	waw.word = async (slug) => {
		const word = await Word.findOne({
			slug
		});

		if (word) {
			return word;
		} else {
			const arr = slug.split('.');
			const page = arr.shift();
			const word = arr.join('.');
			return await Word.create({
				slug,
				word,
				page
			});
		}
	}

	routerWord.post('/create', async (req, res) => {
		const word = await waw.word(req.body.slug)
		res.json();
	});

	routerWord.post('/delete', waw.role('admin'), async (req, res) => {
		await Word.deleteOne({
			_id: req.body._id
		});

		res.json(true);
	});
};
