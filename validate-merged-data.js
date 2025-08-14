#!/usr/bin/env node

/**
 * Validate Merged Data Script
 *
 * Validates the integrity of the merged designs.json file
 */

const fs = require('fs');
const path = require('path');

class DataValidator {
	constructor() {
		this.dataFile = 'data/designs.json';
		this.imagesDir = 'data/images';
		this.issues = [];
		this.stats = {
			totalDesigns: 0,
			validImages: 0,
			missingImages: 0,
			duplicateIds: 0,
			invalidDesigns: 0
		};
	}

	/**
	 * Main validation function
	 */
	validate() {
		console.log('🔍 Validating merged data...\n');

		try {
			const data = this.loadData();
			this.validateStructure(data);
			this.validateDesigns(data.designs);
			this.validateImages(data.designs);
			this.printReport();
		} catch (error) {
			console.error('❌ Validation failed:', error.message);
			process.exit(1);
		}
	}

	/**
	 * Load and parse the main data file
	 */
	loadData() {
		try {
			const content = fs.readFileSync(this.dataFile, 'utf8');
			return JSON.parse(content);
		} catch (error) {
			throw new Error(`Failed to load ${this.dataFile}: ${error.message}`);
		}
	}

	/**
	 * Validate overall data structure
	 */
	validateStructure(data) {
		if (!data.metadata) {
			this.issues.push('Missing metadata section');
		}

		if (!Array.isArray(data.designs)) {
			this.issues.push('Designs is not an array');
			return;
		}

		this.stats.totalDesigns = data.designs.length;

		if (data.metadata && data.metadata.totalDesigns !== this.stats.totalDesigns) {
			this.issues.push(`Metadata totalDesigns (${data.metadata.totalDesigns}) doesn't match actual count (${this.stats.totalDesigns})`);
		}
	}

	/**
	 * Validate individual designs
	 */
	validateDesigns(designs) {
		const seenIds = new Set();

		designs.forEach((design, index) => {
			// Check for required fields
			if (!design.id) {
				this.issues.push(`Design at index ${index} missing ID`);
				this.stats.invalidDesigns++;
				return;
			}

			// Check for duplicate IDs
			if (seenIds.has(design.id)) {
				this.issues.push(`Duplicate ID found: ${design.id}`);
				this.stats.duplicateIds++;
			} else {
				seenIds.add(design.id);
			}

			// Check for basic required fields
			if (!design.name && !design.title) {
				this.issues.push(`Design ${design.id} missing both name and title`);
			}

			if (!design.image) {
				this.issues.push(`Design ${design.id} missing image`);
			}
		});
	}

	/**
	 * Validate image files exist
	 */
	validateImages(designs) {
		designs.forEach(design => {
			if (design.image) {
				const imageName = path.basename(design.image);
				const imagePath = path.join(this.imagesDir, imageName);

				if (fs.existsSync(imagePath)) {
					this.stats.validImages++;
				} else {
					this.issues.push(`Missing image file: ${imageName} (for design ${design.id})`);
					this.stats.missingImages++;
				}
			}
		});
	}

	/**
	 * Print validation report
	 */
	printReport() {
		console.log('📊 Validation Report');
		console.log('===================');
		console.log(`Total designs: ${this.stats.totalDesigns}`);
		console.log(`Valid images: ${this.stats.validImages}`);
		console.log(`Missing images: ${this.stats.missingImages}`);
		console.log(`Duplicate IDs: ${this.stats.duplicateIds}`);
		console.log(`Invalid designs: ${this.stats.invalidDesigns}`);
		console.log(`Total issues: ${this.issues.length}`);

		if (this.issues.length > 0) {
			console.log('\n❌ Issues Found:');
			this.issues.forEach((issue, index) => {
				console.log(`${index + 1}. ${issue}`);
			});
		} else {
			console.log('\n✅ All validations passed!');
		}
	}
}

// CLI Interface
function main() {
	const validator = new DataValidator();
	validator.validate();
}

// Run if called directly
if (require.main === module) {
	main();
}

module.exports = DataValidator;