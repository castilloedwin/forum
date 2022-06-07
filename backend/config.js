module.exports = {
	port: process.env.PORT || 3001,
	token_expire: '2h',
	token_seed: process.env.token_seed || 'coffee-break',
	database: process.env.DB_URL || 'mongodb://127.0.0.1:27017/coffee'
}