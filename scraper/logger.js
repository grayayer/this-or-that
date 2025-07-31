/**
 * Logger utility for Land-book scraper with progress reporting
 */

const fs = require('fs').promises;
const path = require('path');

class ScraperLogger {
	constructor(options = {}) {
		this.level = options.level || 'info';
		this.showProgress = options.showProgress !== false;
		this.logToFile = options.logToFile || false;
		this.logFile = options.logFile || 'scraper.log';
		this.startTime = Date.now();

		// Progress tracking
		this.progress = {
			total: 0,
			completed: 0,
			errors: 0,
			currentTask: null
		};

		// Log levels
		this.levels = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3
		};

		this.currentLevel = this.levels[this.level] || 1;
	}

	/**
	 * Initialize progress tracking
	 */
	initProgress(total, taskName = 'Processing') {
		this.progress.total = total;
		this.progress.completed = 0;
		this.progress.errors = 0;
		this.progress.currentTask = taskName;
		this.progress.startTime = Date.now();

		if (this.showProgress) {
			this.info(`🚀 Starting ${taskName}: ${total} items to process`);
			this.updateProgressBar();
		}
	}

	/**
	 * Update progress
	 */
	updateProgress(increment = 1, error = false) {
		this.progress.completed += increment;
		if (error) {
			this.progress.errors++;
		}

		if (this.showProgress) {
			this.updateProgressBar();
		}
	}

	/**
	 * Display progress bar
	 */
	updateProgressBar() {
		if (!this.showProgress || this.progress.total === 0) return;

		const percentage = Math.round((this.progress.completed / this.progress.total) * 100);
		const barLength = 30;
		const filledLength = Math.round((percentage / 100) * barLength);
		const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

		const elapsed = Date.now() - this.progress.startTime;
		const rate = this.progress.completed / (elapsed / 1000);
		const eta = this.progress.completed > 0 ?
			Math.round((this.progress.total - this.progress.completed) / rate) : 0;

		const stats = [
			`${this.progress.completed}/${this.progress.total}`,
			`${percentage}%`,
			this.progress.errors > 0 ? `${this.progress.errors} errors` : null,
			rate > 0 ? `${rate.toFixed(1)}/s` : null,
			eta > 0 ? `ETA: ${this.formatTime(eta)}` : null
		].filter(Boolean).join(' | ');

		// Clear line and write progress
		process.stdout.write(`\r📊 [${bar}] ${stats}`);

		if (this.progress.completed >= this.progress.total) {
			process.stdout.write('\n');
			const totalTime = Date.now() - this.progress.startTime;
			this.info(`✅ ${this.progress.currentTask} completed in ${this.formatTime(totalTime / 1000)}`);
		}
	}

	/**
	 * Format time in human readable format
	 */
	formatTime(seconds) {
		if (seconds < 60) return `${Math.round(seconds)}s`;
		if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
		return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
	}

	/**
	 * Log debug message
	 */
	debug(message, data = null) {
		this._log('debug', '🔍', message, data);
	}

	/**
	 * Log info message
	 */
	info(message, data = null) {
		this._log('info', 'ℹ️', message, data);
	}

	/**
	 * Log warning message
	 */
	warn(message, data = null) {
		this._log('warn', '⚠️', message, data);
	}

	/**
	 * Log error message
	 */
	error(message, data = null) {
		this._log('error', '❌', message, data);
	}

	/**
	 * Log success message
	 */
	success(message, data = null) {
		this._log('info', '✅', message, data);
	}

	/**
	 * Internal logging method
	 */
	async _log(level, emoji, message, data = null) {
		if (this.levels[level] < this.currentLevel) return;

		const timestamp = new Date().toISOString();
		const logMessage = `${emoji} ${message}`;

		// Console output
		console.log(logMessage);

		if (data) {
			console.log('   Data:', typeof data === 'object' ? JSON.stringify(data, null, 2) : data);
		}

		// File output
		if (this.logToFile) {
			const fileMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
			const fullMessage = data ?
				`${fileMessage}\n   Data: ${JSON.stringify(data)}\n` :
				`${fileMessage}\n`;

			try {
				await fs.appendFile(this.logFile, fullMessage);
			} catch (error) {
				console.error('Failed to write to log file:', error.message);
			}
		}
	}

	/**
	 * Log scraping statistics
	 */
	logStats(stats) {
		this.info('📊 Scraping Statistics:');
		console.log(`   Total items processed: ${stats.totalProcessed || 0}`);
		console.log(`   Successful extractions: ${stats.successCount || 0}`);
		console.log(`   Errors: ${stats.errorCount || 0}`);
		console.log(`   Success rate: ${stats.totalProcessed > 0 ?
			Math.round((stats.successCount / stats.totalProcessed) * 100) : 0}%`);

		if (stats.avgTagsPerDesign) {
			console.log(`   Average tags per design: ${stats.avgTagsPerDesign.toFixed(1)}`);
		}

		if (stats.topStyleTags && stats.topStyleTags.length > 0) {
			console.log(`   Top style tags: ${stats.topStyleTags.slice(0, 5).join(', ')}`);
		}

		if (stats.topIndustries && stats.topIndustries.length > 0) {
			console.log(`   Top industries: ${stats.topIndustries.slice(0, 5).join(', ')}`);
		}

		const totalTime = Date.now() - this.startTime;
		console.log(`   Total execution time: ${this.formatTime(totalTime / 1000)}`);
	}

	/**
	 * Log error summary
	 */
	logErrorSummary(errors) {
		if (!errors || errors.length === 0) return;

		this.warn(`Error Summary (${errors.length} total):`);

		// Group errors by type
		const errorsByType = {};
		errors.forEach(error => {
			const type = error.type || 'unknown';
			if (!errorsByType[type]) errorsByType[type] = [];
			errorsByType[type].push(error);
		});

		Object.entries(errorsByType).forEach(([type, typeErrors]) => {
			console.log(`   ${type}: ${typeErrors.length} errors`);

			// Show first few examples
			typeErrors.slice(0, 3).forEach((error, index) => {
				const message = error.error || error.message || 'Unknown error';
				const url = error.url ? ` (${error.url.substring(0, 50)}...)` : '';
				console.log(`     ${index + 1}. ${message}${url}`);
			});

			if (typeErrors.length > 3) {
				console.log(`     ... and ${typeErrors.length - 3} more`);
			}
		});
	}

	/**
	 * Create a child logger with context
	 */
	child(context) {
		const childLogger = new ScraperLogger({
			level: this.level,
			showProgress: false, // Child loggers don't show progress
			logToFile: this.logToFile,
			logFile: this.logFile
		});

		childLogger.context = context;
		return childLogger;
	}
}

module.exports = ScraperLogger;