const geoip = require("geoip-lite");
module.exports = async (waw) => {
	const TranslateSchema = waw.mongoose.Schema({
		translate: String,
		slug: String,
		lang: String,
		appId: String,
	});

	const Translates = waw.mongoose.model("Translate", TranslateSchema);

	const WordSchema = waw.mongoose.Schema({
		slug: String,
		word: String,
		page: String,
		description: String,
		appId: String,
	});

	const Word = waw.mongoose.model("Word", WordSchema);

	const routerTranslate = waw.router("/api/translate");

	waw.translate = (req) => {
		return (obj) => { };
	};

	waw.translates = async (lang, appId = "") => {
		const translates = await Translates.find(
			appId
				? {
					lang,
					appId,
				}
				: {
					lang,
				}
		);

		const obj = {};

		for (var i = 0; i < translates.length; i++) {
			obj[translates[i].slug] = translates[i].translate;
		}

		return obj;
	};

	const translates = {};
	waw.config.languages = waw.config.languages || ["en"];
	for (const lang of waw.config.languages) {
		translates[lang] = await waw.translates(lang);
	}

	routerTranslate.post("/set", (req, res) => {
		req.session.language = req.body.language;
		res.json(true);
	});

	waw.translate = (req) => {
		let lang = req.session.language ? req.session.language : "en";
		if (!req.session.language) {
			const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

			const geo = geoip.lookup(ip);

			if (geo && geo.country === "UA") {
				lang = "uk";
			}
		}

		if (!translates[lang]) {
			translates[lang] = {};
		}

		return (obj) => {
			obj.translate = (slug) => {
				const word = slug.split(".").slice(1).join(".");

				if (typeof translates[lang][slug] !== "string") {
					waw.word(slug);
				}

				return lang ? translates[lang][slug] || word : word;
			};
		};
	};

	const get = async (req, res) => {
		const translates = await Translates.find(
			req.params.appId ? { appId: req.params.appId } : {}
		);

		const obj = {};

		for (var i = 0; i < translates.length; i++) {
			if (!obj[translates[i].lang]) obj[translates[i].lang] = {};

			obj[translates[i].lang][translates[i].slug] = translates[i].translate;
		}

		res.json(obj);
	};
	routerTranslate.get("/get", get);
	routerTranslate.get("/get/:appId", get);

	routerTranslate.post("/create", async (req, res) => {
		const translate = await Translates.findOne(
			req.body.appId
				? {
					slug: req.body.slug,
					lang: req.body.lang,
					appId: req.body.appId,
				}
				: {
					slug: req.body.slug,
					lang: req.body.lang,
				}
		);

		translates[req.body.lang] = translates[req.body.lang] || {};
		translates[req.body.lang][req.body.slug] = req.body.translate;

		if (translate) {
			translate.translate = req.body.translate;

			await translate.save();
			res.json(true);
		} else {
			await Translates.create(req.body);

			res.json(true);
		}
	});

	routerTranslate.post("/delete", waw.role("admin"), async (req, res) => {
		await Translates.deleteMany(
			req.body.appId
				? {
					appId: req.body.appId,
					slug: req.body.slug,
				}
				: {
					slug: req.body.slug,
				}
		);

		res.json(true);
	});

	const routerWord = waw.router("/api/word");

	const getWord = async (req, res) => {
		const words = await Word.find(
			req.params.appId ? { appId: req.params.appId } : {}
		);

		res.json(words || []);
	};
	routerWord.get("/get", getWord);
	routerWord.get("/get/:appId", getWord);

	waw.word = async (slug, appId = "") => {
		const word = await Word.findOne(
			appId
				? {
					appId,
					slug,
				}
				: {
					slug,
				}
		);

		if (word) {
			return word;
		} else {
			const arr = slug.split(".");
			const page = arr.shift();
			const word = arr.join(".");
			return await Word.create({
				slug,
				word,
				page,
				appId,
			});
		}
	};

	routerWord.post("/create", async (req, res) => {
		res.json(await waw.word(req.body.slug, req.body.appId || ""));
	});

	routerWord.post("/delete", waw.role("admin"), async (req, res) => {
		await Word.deleteOne(
			req.body.appId
				? {
					appId: req.body.appId,
					_id: req.body._id,
				}
				: {
					_id: req.body._id,
				}
		);

		res.json(true);
	});
};
