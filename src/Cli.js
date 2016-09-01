import './Output'
import './MakeCommandCommand'
import './PromptCommand'
import './TinkerCommand'

import program from 'commander'

export class Cli {
	app = null
	commands = [ ]
	output = null

	_booted = false
	_cli = null

	constructor(app) {
		this.app = app
		this.output = new Output
		this.register(MakeCommandCommand)
		this.register(PromptCommand)
		this.register(TinkerCommand)
	}

	async boot() {
		await this.app.boot()

		if(!this._cli.isNil) {
			return this._cli
		}

		const info = require(this.app.paths.package)
		this._cli = new program.Command('cli')

		if(!info.version.isNil) {
			this._cli.version(info.version)
		}

		this.commands.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

		try {
			for(const command of this.commands) {
				command.build(this._cli)
			}
		} catch(e) {
			this.output.error('Error booting cli', e)
			process.exit(1, e)
		}

		this._cli.on('*', args => {
			this.output.error('Command ”%s” not found.', args.shift())
			process.exit(1)
		})

		if(this._cli.length === 2) {
			this._cli.push('--help')
		}

		return this._cli
	}

	async run(args = process.argv) {
		const cli = await this.boot()

		if(args.length === 2) {
			args.push('--help')
		}

		cli.parse(args)
	}

	find(name) {
		for(const command of this.commands) {
			if(command.name === name) {
				return command
			}
		}

		return null
	}

	register(...commands) {
		if(commands.length === 1) {
			if(Array.isArray(commands[0])) {
				commands = commands[0]
			}
		}

		for(const command of commands) {
			if(typeof command === 'function') {
				this.commands.push(new command(this.app, this))
			} else {
				this.commands.push(command)
			}
		}
	}

}
