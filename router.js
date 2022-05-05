var Translates = require(__dirname+'/translate.js');
var Word = require(__dirname+'/word.js');

module.exports = function(sd) {
	var router = sd.router('/api/translate');
	router.get('/get', function(req, res){
		Translates.find({}, function(err, docs){
			res.json(docs);
		})
	});
	router.get('/get_translates', function(req, res){
		Translates.find({}, function(err, docs){
			let obj = {};
			for (var i = 0; i < docs.length; i++) {
				if(!obj[docs[i].lang]) obj[docs[i].lang]={};
				//if(!obj[docs[i].lang][docs[i].page]) obj[docs[i].lang][docs[i].page]={};
				obj[docs[i].lang][docs[i].slug] = docs[i].translate;
			}
			res.json(obj);
		})
	});
	router.post('/create', function(req, res){
		Translates.findOne({
			slug: req.body.slug,
			lang: req.body.lang
		}, function(err, doc){
			if(doc){
				doc.translate = req.body.translate;
				doc.save(function(){
					res.json(true);
				});
			}else{
				Translates.create(req.body, function(err, created){
					res.json(true);
				});
			}
		});
	});	
	router.post('/delete', function(req, res){
		Translates.deleteOne({
			_id: req.body._id
		}, function(err){
			res.json(true);
		}); 
	});
	var routerWord = sd.router('/api/word');
	routerWord.get('/get', function(req, res){
		Word.find({}, function(err, docs){
			res.json(docs||[]);
		});
	});
	routerWord.post('/create', function(req, res){
		Word.findOne({
			slug: req.body.slug
		}, function(err, doc){
			if(doc) return res.json(false);
			Word.create(req.body, function(err, created){
				res.json(created);
			});
		});
	});
	routerWord.post('/delete', function(req, res){
		Word.deleteOne({
			_id: req.body._id
		}, function(err){
			res.json(true);
		});
	});
};