#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Optional script to rename images by removing unique identifiers
 * This creates cleaner filenames like "seriant-org.webp" instead of "c41a3bb8bc0f1430-seriant-org.webp"
 */

async function renameImages() {
	console.log('🔄 Renaming images to remove unique identifiers...');

	try {
		const imagesDir = 'data/images';
		const files = await fs.readdir(imagesDir);
		const webpFiles = files.filter(file => file.endsWith('.webp'));

		console.log(`📁 Found ${webpFiles.length} image files to process`);

		const renames = [];

		for (const file of webpFiles) {
			// Skip files that don't have the unique identifier pattern
			if (!file.match(/^[a-f0-9]{16}-/)) {
				console.log(`   ⏭️  Skipping ${file} (no unique identifier)`);
				continue;
			}

			// Remove the unique identifier (first 17 characters: 16 hex chars + dash)
			const newName = file.substring(17);
			const oldPath = path.join(imagesDir, file);
			const newPath = path.join(imagesDir, newName);

			// Check if target file already exists
			try {
				await fs.access(newPath);
				console.log(`   ⚠️  Target ${newName} already exists, skipping ${file}`);
				continue;
			} catch (error) {
				// File doesn't exist, we can rename
			}

			renames.push({ oldName: file, newName, oldPath, newPath });
		}

		console.log(`\n📝 Planning to rename ${renames.length} files:`);
		renames.forEach(({ oldName, newName }) => {
			console.log(`   ${oldName} → ${newName}`);
		});

		// Ask for confirmation
		const readline = require('readline');
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		const answer = await new Promise(resolve => {
			rl.question('\n❓ Proceed with renaming? (y/N): ', resolve);
		});
		rl.close();

		if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
			console.log('❌ Renaming cancelled');
			return;
		}

		// Perform the renames
		console.log('\n🔄 Renaming files...');
		for (const { oldName, newName, oldPath, newPath } of renames) {
			await fs.rename(oldPath, newPath);
			console.log(`   ✅ ${oldName} → ${newName}`);
		}

		console.log(`\n🎉 Successfully renamed ${renames.length} files!`);

		// Update the designs.json file to use the new filenames
		console.log('\n🔄 Updating designs.json with new filenames...');
		const designsData = JSON.parse(await fs.readFile('data/designs.json', 'utf8'));

		let updatedCount = 0;
		designsData.designs.forEach(design => {
			const currentImage = design.image;
			if (currentImage.startsWith('./data/images/')) {
				const filename = path.basename(currentImage);
				const rename = renames.find(r => r.oldName === filename);
				if (rename) {
					design.image = `./data/images/${rename.newName}`;
					updatedCount++;
				}
			}
		});

		await fs.writeFile('data/designs.json', JSON.stringify(designsData, null, 2));
		console.log(`✅ Updated ${updatedCount} image references in designs.json`);

		console.log('\n🎉 Image renaming completed successfully!');
		console.log('💡 You can now run the app with cleaner image filenames');

	} catch (error) {
		console.error('❌ Error renaming images:', error.message);
		throw error;
	}
}

// Run the renaming if this file is executed directly
if (require.main === module) {
	renameImages()
		.then(() => {
			console.log('\n✨ Renaming completed!');
			process.exit(0);
		})
		.catch((error) => {
			console.error('\n💥 Renaming failed:', error);
			process.exit(1);
		});
}

module.exports = { renameImages };