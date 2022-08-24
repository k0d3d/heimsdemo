/**
 * Module Dependecies
 */

var restler = require('request'),
		util = require('util'),
		config = require('config');

function UserController () {

}

UserController.prototype.constructor = UserController;

UserController.prototype.login = function (data, cb) {
	restler.post(config.api.DS_CLOUD_URL + '/api/session', {
		data: data
	})
	.on('complete', function (data, resp) {
		if (resp.statusCode === 401 || resp.statusCode === 500 ) {
			cb(new Error(data));
		} else {
			cb(data);
		}
	});
};

var user = new UserController();

module.exports.routes = function (app) {
	app.post('/api/user/session', function (req, res, next) {
		console.log(req.body);
		user.login(req.body, function (r) {
			if (util.isError(r)) {
				next(r);
			} else {
				res.json(202, true);
			}
		});
	});

	app.delete('/api/user/session', function (req, res, next) {
		user.logout(req.session.clientSession, function () {

		});
	});
};
module.exports.user = user;