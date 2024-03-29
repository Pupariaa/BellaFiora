const dbreader = require('osudb')
const conf = require('./priv/credentials')
const fs = require('fs')
const path = require('path')
const AppError = require('./error')

class osuFiles {
	async osuDbParse(mainWindow) {
		const Conf = new conf();
		return new Promise(async (resolve) => {
			if (fs.existsSync(
					path.join(Conf.getConf('osu_path'), '/osu!.db'))) {
				dbreader.readOsuDB(
					path.join(Conf.getConf('osu_path'), '/osu!.db'),
					async function(data) {
						const fileStream = fs.createWriteStream(
							path.join(
								Conf.getConf('AppPath'), '/beatmaps.json'),
							{ flags : 'a' });
						data.beatmaps.forEach(entry => {
							const jsonEntry = JSON.stringify(entry, null, 2) + ',\n';
							fileStream.write(jsonEntry);
						});
						fileStream.end();
						resolve(true)
					})
			} else {
				await AppError(mainWindow, 'cannot get osu!.db')
			}
		});
	}

	async scoreDbParse(mainWindow) {
		const Conf = new conf();
		return new Promise(async (resolve) => {
			if (fs.existsSync(
					path.join(Conf.getConf('osu_path'), '/scores.db'))) {
				dbreader.readScoresDB(
					path.join(Conf.getConf('osu_path'), '/scores.db'),
					function(data) {
						fs.writeFileSync(
							path.join(Conf.getConf('AppPath'), '/scores.json'),
							JSON.stringify(data, null, 2))
						resolve(true)
					});
			} else {
				await AppError(mainWindow, 'cannot get scores.db')
			}
		})
	}

	async updateScores(mainWindow) {
		const Conf = new conf();
		return new Promise(async (resolve) => {
			let scoresData = require(path.join(Conf.getConf('AppPath'), '/scores.json'));
			const fileStream = fs.createWriteStream(
				path.join(Conf.getConf('AppPath'), '/beatmaps.json'),
				{ flags : 'a' });
			dbreader.readOsuDB(
				path.join(Conf.getConf('osu_path'), 'osu!.db'), function(data) {
					data.beatmaps.forEach(entry => {
						if (scoresData[entry.md5]) {
							scoresData[entry.md5].push(entry);
						}
					});
					fileStream.end();
					fs.writeFileSync(
						path.join(Conf.getConf('AppPath'), '/scores.json'),
						JSON.stringify(scoresData, null, 2));
					resolve(true)
				});
		})
	}
}

module.exports = osuFiles
