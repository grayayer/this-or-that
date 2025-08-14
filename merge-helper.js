#!/usr/bin/env node

/**
 * Merge Helper Script
 *
 * Interactive helper for merging scraped data files
 */

const fs = require('fs');
const path = require('path');
const DataMerger = require('./merge-scraped-data.js');

class MergeHelper {
	constructor() {
		this.scrapedDir = 'scrape-saved-html';
	}

	/**
	 * Find all JSON files in the scraped directory
	 */
	findScrapedFiles() {
		if (!fs.existsSync(this.scrapedDir)) {
			console.log(`❌ Scraped directory not found: ${this.scrapedDir}`);
			return [];
		}

		const files = fs.readdirSync(this.scrapedDir)
			.filter(file => file.endsWith('.json'))
			.map(file => ({
				name: file,
				path: path.join(this.scrapedDir, file),
				stats: fs.statSync(path.join(this.scrapedDir, file))
			}))
			.sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first

		return files;
	}

	/**
	 * Get file info for display
	 */
	getFileInfo(filePath) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			const data = JSON.parse(content);

			return {
				designs: data.designs ? data.designs.length : 0,
				scrapedAt: data.metadata?.scrapedAt || 'Unknown',
				source: data.metadata?.source || 'Unknown'
			};
		} catch (error) {
			return {
				designs: 'Error',
				scrapedAt: 'Error',
				source: 'Error'
			};
		}
	}

	/**
	 * Interactive file selection
	 */
	async selectFile() {
		const files = this.findScrapedFiles();

		if (files.length === 0) {
			console.log('❌ No JSON files found in scraped directory');
			return null;
		}

		console.log('\n📁 Available scraped files:');
		console.log('==========================');

		files.forEach((file, index) => {
			const info = this.getFileInfo(file.path);
			const modTime = file.stats.mtime.toLocaleString();

			console.log(`${index + 1}. ${file.name}`);
			console.log(`   📊 ${info.designs} designs | 🕒 ${modTime}`);
			console.log(`   📝 Source: ${info.source} | Scraped: ${info.scrapedAt}`);
			console.log('');
		});

		// For now, return the most recent file
		// In a full implementation, you'd add readline for user input
		console.log(`🎯 Auto-selecting most recent file: ${files[0].name}`);
		return files[0].path;
	}

	/**
	 * Main helper function
	 */
	async run() {
		console.log('🔧 Merge Helper - Interactive Data Merger');
		console.log('=========================================\n');

		const selectedFile = await this.selectFile();

		if (!selectedFile) {
			process.exit(1);
		}

		console.log(`\n🚀 Starting merge for: ${selectedFile}`);

		const merger = new DataMerger();
		await merger.merge(selectedFile);
	}
}

// CLI Interface
async function main() {
	const helper = new MergeHelper();
	await helper.run();
}

// Run if called directly
if (require.main === module) {
	main().catch(error => {
		console.error('❌ Fatal error:', error.message);
		process.exit(1);
	});
}

module.exports = MergeHelper;