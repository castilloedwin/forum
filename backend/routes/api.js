const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const objectID = require('mongodb').ObjectID;
const config = require('../config');

const api = (app, db) => {

	const tokenVerification = require('../app/middlewares/auth')(db);

	app.get('/tasks', (req, res) => {
		db.db().collection('tasks').find({}).sort({ _id: -1 }).toArray((err, tasks) => {
			if (err) {
				return res.status(400).json({
					err
				});
			}
			return res.status(200).json(tasks);
		});
	});

	app.get('/tasks/:id', (req, res) => {
		const id = req.params.id;
		db.db().collection('tasks').findOne({ _id: new objectID(id) }, (err, task) => {
			if (err) {
				return res.status(200).json({
					err
				});
			}

			return res.status(200).json({
				message: 'Tarea encontrada',
				task
			})
		});
	});

	app.post('/tasks', (req, res) => {
		db.db().collection('tasks').insertOne(req.body, (err, task) => {
			if (err) {
				return res.status(500).json({
					err
				});
			}

			return res.status(201).json({
				message: 'Se creó correctamente la tarea',
				status: 201
			});
		});
	});

	app.delete('/tasks/:id', (req, res) => {
		const id = req.params.id;
		db.db().collection('tasks').deleteOne({ _id: new objectID(id) }, (err, task) => {
			if (err) {
				return res.status(200).json({
					err
				});
			}

			return res.status(200).json({
				message: 'Tarea eliminada',
				status: 200
			});
		});
	});

	app.get('/comments', (req, res) => {
		db.db().collection('comments').find({}).sort({ _id: -1 }).toArray((err, comments) => {
			if (err) {
				return res.status(500).json({
					err
				});
			}

			res.status(200).json(comments);
		});
	});

	app.post('/comments', tokenVerification, (req, res) => {
		db.db().collection('comments').insertOne(req.body, (err, comment) => {
			if (err) {
				return res.status(500).json({
					err
				});
			}

			res.status(201).json({
				message: 'Se insertó el comentario correctamente',
				status: 201
			});
		});
	});

	app.post('/register', (req, res) => {
		let { username, password } = req.body;
		
		username = username.toLowerCase().replace(/\s/g, '-');
		
		if ( password.length <= 5 ) {
			return res.status(200).json({
				message: 'La contraseña debe tener más de 5 caracteres'
			});
		}

		password = bcrypt.hashSync( password, bcrypt.genSaltSync(10));

		const user = {
			username,
			name: req.body.name,
			last_name: req.body.last_name,
			email: req.body.email,
			password,
			created_at: new Date()
		}

		db.db().collection('users').insertOne(user, (err, user) => {
			if (err) {
				return res.status(500).json({
					err
				});
			}

			return res.status(200).json({
				message: 'Usuario creado satisfactoriamente',
				user,
				status: 200
			});
		});
	});

	app.post('/login', (req, res) => {
		let { email, password } = req.body;
		let hash = bcrypt.hashSync( password, bcrypt.genSaltSync(10) );
		db.db().collection('users').findOne({ email }, (err, user) => {
			if (err) {
				return res.status(500).json({
					err
				});
			}

			if ( !user ) return res.status(400).json({ message: 'No se encontró este usuario' });

			try {
				if ( !bcrypt.compareSync(password, user.password) ) {
					return res.status(400).json({ message: 'La contraseña es incorrecta' });
				}
			} catch (err) {
				return console.log(err);
			}

			let token = jwt.sign({
				sub: user._id,
				iat: new Date().getTime()
			}, config.token_seed, { expiresIn: config.token_expire });

			return res.status(200).json({
				token
			});
		});
	});
}

module.exports = api;