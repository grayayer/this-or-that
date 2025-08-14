#!/usr/bin/env node

/**
 * Merge Scraped Data Script
 *
 * This script merges new scraped JSON data into the main designs.json file
 * and copies referenced images to the data/images/ folder.
 *
 * Usage: node merge-scraped-data.js <scraped-file.json>
 * Example: node merge-scraped-data.js scrape-saved-html/scraped-designs.json
 */

const fs = require('fs');
const path = require('path');

// Configuration
const MAIN_DATA_FILE = 'data/designs.json';
const IMAGES_DIR = 'data/images';
const BACKUP_DIR = 'data/backups';

class DataMerger {
	constructor() {
		this.stats = {
			newDesigns: 0,
			updatedDesigns: 0,
			skippedDesigns: 0,
			copiedImages: 0,
			failedImages: 0,
			errors: []
		};
	}

	/**
	 * Main merge function
	 */
	async merge(scrapedFilePath) {
		try {
			console.log(`🚀 Starting merge process for: ${scrapedFilePath}`);

			// Validate input file
			if (!fs.existsSync(scrapedFilePath)) {
				throw new Error(`Scraped file not found: ${scrapedFilePath}`);
			}

			// Load data files
			const scrapedData = this.loadJsonFile(scrapedFilePath);
			const mainData = this.loadJsonFile(MAIN_DATA_FILE);

			// Create backup
			await this.createBackup(mainData);

			// Merge designs
			const mergedData = await this.mergeDesigns(mainData, scrapedData);

			// Copy images
			await this.copyImages(scrapedData, path.dirname(scrapedFilePath));

			// Save merged data
			await this.saveMainData(mergedData);

			// Print summary
			this.printSummary();

			console.log('✅ Merge completed successfully!');

		} catch (error) {
			console.error('❌ Merge failed:', error.message);
			process.exit(1);
		}
	}

	/**
	 * Load and parse JSON file
	 */
	loadJsonFile(filePath) {
		try {
			const content = fs.readFileSync(filePath, 'utf8');
			return JSON.parse(content);
		} catch (error) {
			throw new Error(`Failed to load ${filePath}: ${error.message}`);
		}
	}

	/**
	 * Create backup of main data file
	 */
	async createBackup(mainData) {
		try {
			// Ensure backup directory exists
			if (!fs.existsSync(BACKUP_DIR)) {
				fs.mkdirSync(BACKUP_DIR, { recursive: true });
			}

			const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
			const backupPath = path.join(BACKUP_DIR, `designs-backup-${timestamp}.json`);

			fs.writeFileSync(backupPath, JSON.stringify(mainData, null, 2));
			console.log(`📦 Backup created: ${backupPath}`);
		} catch (error) {
			console.warn(`⚠️  Failed to create backup: ${error.message}`);
		}
	}

	/**
	 * Merge scraped designs into main data
	 */
	async mergeDesigns(mainData, scrapedData) {
		console.log('🔄 Merging designs...');

		// Create a map of existing designs by ID for quick lookup
		const existingDesigns = new Map();
		mainData.designs.forEach((design, index) => {
			existingDesigns.set(design.id, { design, index });
		});

		// Process each scraped design
		for (const scrapedDesign of scrapedData.designs) {
			try {
				// Update image path to reflect new location in data/images/
				const processedDesign = this.updateImagePath(scrapedDesign);

				if (existingDesigns.has(scrapedDesign.id)) {
					// Update existing design
					const existing = existingDesigns.get(scrapedDesign.id);
					mainData.designs[existing.index] = this.mergeDesignData(existing.design, processedDesign);
					this.stats.updatedDesigns++;
					console.log(`📝 Updated: ${scrapedDesign.id}`);
				} else {
					// Add new design
					mainData.designs.push(processedDesign);
					this.stats.newDesigns++;
					console.log(`➕ Added: ${scrapedDesign.id}`);
				}
			} catch (error) {
				this.stats.errors.push(`Failed to process ${scrapedDesign.id}: ${error.message}`);
				this.stats.skippedDesigns++;
				console.warn(`⚠️  Skipped ${scrapedDesign.id}: ${error.message}`);
			}
		}

		// Update metadata
		mainData.metadata = this.updateMetadata(mainData.metadata, scrapedData.metadata);

		return mainData;
	}

	/**
	 * Update image path to reflect new location in data/images/
	 */
	updateImagePath(design) {
		if (!design.image) {
			return design;
		}

		// Extract just the filename from the image path
		const filename = path.basename(design.image);

		// Update the design with the new path
		return {
			...design,
			image: `data/images/${filename}`
		};
	}

	/**
	 * Merge individual design data, preserving existing data where appropriate
	 */
	mergeDesignData(existing, scraped) {
		return {
			...existing,
			...scraped,
			// Preserve certain fields if they exist in the original
			name: scraped.name || existing.name,
			title: scraped.title || existing.title,
			// Merge tags intelligently
			tags: this.mergeTags(existing.tags, scraped.tags),
			// Update timestamp
			updatedAt: new Date().toISOString()
		};
	}

	/**
	 * Merge tag objects, combining arrays and preserving unique values
	 */
	mergeTags(existingTags = {}, scrapedTags = {}) {
		const merged = { ...existingTags };

		for (const [category, tags] of Object.entries(scrapedTags)) {
			if (Array.isArray(tags)) {
				if (merged[category]) {
					// Combine and deduplicate arrays
					merged[category] = [...new Set([...merged[category], ...tags])];
				} else {
					merged[category] = [...tags];
				}
			} else {
				merged[category] = tags;
			}
		}

		return merged;
	}

	/**
	 * Update main metadata with scraped metadata
	 */
	updateMetadata(mainMeta, scrapedMeta) {
		return {
			...mainMeta,
			totalDesigns: mainMeta.totalDesigns + this.stats.newDesigns,
			lastMergeAt: new Date().toISOString(),
			lastMergeSource: scrapedMeta.source || 'unknown',
			lastMergeStats: {
				newDesigns: this.stats.newDesigns,
				updatedDesigns: this.stats.updatedDesigns,
				scrapedAt: scrapedMeta.scrapedAt
			}
		};
	}
	/**
	  * Copy images from scraped directory to main images directory
	  */
	async copyImages(scrapedData, sourceDir) {
		console.log('🖼️  Copying images...');

		// Ensure images directory exists
		if (!fs.existsSync(IMAGES_DIR)) {
			fs.mkdirSync(IMAGES_DIR, { recursive: true });
		}

		for (const design of scrapedData.designs) {
			if (design.image) {
				try {
					await this.copyImage(design.image, sourceDir);
				} catch (error) {
					this.stats.errors.push(`Failed to copy image for ${design.id}: ${error.message}`);
					this.stats.failedImages++;
					console.warn(`⚠️  Failed to copy image: ${design.image}`);
				}
			}
		}
	}

	/**
	 * Copy individual image file
	 */
	async copyImage(imagePath, sourceDir) {
		// Handle relative paths
		let fullSourcePath;
		if (imagePath.startsWith('./')) {
			fullSourcePath = path.join(sourceDir, imagePath.substring(2));
		} else if (path.isAbsolute(imagePath)) {
			fullSourcePath = imagePath;
		} else {
			fullSourcePath = path.join(sourceDir, imagePath);
		}

		// Check if source file exists
		if (!fs.existsSync(fullSourcePath)) {
			throw new Error(`Source image not found: ${fullSourcePath}`);
		}

		// Generate destination filename
		const filename = path.basename(imagePath);
		const destPath = path.join(IMAGES_DIR, filename);

		// Skip if file already exists and is the same size
		if (fs.existsSync(destPath)) {
			const sourceStats = fs.statSync(fullSourcePath);
			const destStats = fs.statSync(destPath);

			if (sourceStats.size === destStats.size) {
				console.log(`⏭️  Skipped (exists): ${filename}`);
				return;
			}
		}

		// Copy the file
		fs.copyFileSync(fullSourcePath, destPath);
		this.stats.copiedImages++;
		console.log(`📁 Copied: ${filename}`);
	}

	/**
	 * Save merged data back to main file
	 */
	async saveMainData(mergedData) {
		try {
			const jsonString = JSON.stringify(mergedData, null, 2);
			fs.writeFileSync(MAIN_DATA_FILE, jsonString);
			console.log(`💾 Saved merged data to: ${MAIN_DATA_FILE}`);
		} catch (error) {
			throw new Error(`Failed to save main data: ${error.message}`);
		}
	}

	/**
	 * Print merge summary
	 */
	printSummary() {
		console.log('\n📊 Merge Summary:');
		console.log('================');
		console.log(`New designs added: ${this.stats.newDesigns}`);
		console.log(`Existing designs updated: ${this.stats.updatedDesigns}`);
		console.log(`Designs skipped: ${this.stats.skippedDesigns}`);
		console.log(`Images copied: ${this.stats.copiedImages}`);
		console.log(`Images failed: ${this.stats.failedImages}`);

		if (this.stats.errors.length > 0) {
			console.log('\n❌ Errors:');
			this.stats.errors.forEach(error => console.log(`  - ${error}`));
		}
	}
}

// CLI Interface
async function main() {
	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.log('Usage: node merge-scraped-data.js <scraped-file.json>');
		console.log('Example: node merge-scraped-data.js scrape-saved-html/scraped-designs.json');
		process.exit(1);
	}

	const scrapedFilePath = args[0];
	const merger = new DataMerger();

	await merger.merge(scrapedFilePath);
}

// Run if called directly
if (require.main === module) {
	main().catch(error => {
		console.error('❌ Fatal error:', error.message);
		process.exit(1);
	});
}

module.exports = DataMerger;