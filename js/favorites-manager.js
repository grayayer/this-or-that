/**
 * Favorites Manager
 * Handles tracking user preferences and favorite designs
 * Stores data in localStorage and provides top favorites analysis
 */

/**
 * Helper function to extract clean title from design name
 * @param {string} designName - The design name (e.g., "Company Name | Description | Domain")
 * @returns {string} - Clean company/title name
 */
function extractCleanTitle(designName) {
	if (!designName) {
		console.warn('⚠️ extractCleanTitle called with empty designName');
		return 'Untitled Design';
	}

	// Split by pipe character and use the first part as the clean title
	const nameParts = designName.split('|').map(part => part.trim());
	const cleanTitle = nameParts[0] || designName;

	if (!cleanTitle || cleanTitle.trim() === '') {
		console.warn('⚠️ extractCleanTitle produced empty title from:', designName);
		return 'Untitled Design';
	}

	return cleanTitle;
}

/**
 * Favorites tracking system
 * Tracks selection counts and heart bookmarks for each design
 */
const FavoritesManager = {
	// Storage keys
	STORAGE_KEYS: {
		SELECTIONS: 'thisOrThat_selectionCounts',
		HEARTS: 'thisOrThat_heartBookmarks'
	},

	/**
	 * Initialize the favorites manager
	 */
	init() {
		console.log('🎯 Initializing Favorites Manager...');
		this.ensureStorageExists();
	},

	/**
	 * Ensure localStorage structures exist
	 */
	ensureStorageExists() {
		if (!localStorage.getItem(this.STORAGE_KEYS.SELECTIONS)) {
			localStorage.setItem(this.STORAGE_KEYS.SELECTIONS, JSON.stringify({}));
		}
		if (!localStorage.getItem(this.STORAGE_KEYS.HEARTS)) {
			localStorage.setItem(this.STORAGE_KEYS.HEARTS, JSON.stringify({}));
		}
	},

	/**
	 * Record a design selection
	 * @param {string} designId - ID of the selected design
	 * @param {Object} designData - Full design object for reference
	 */
	recordSelection(designId, designData) {
		try {
			const selections = this.getSelectionCounts();

			// Increment selection count
			selections[designId] = (selections[designId] || 0) + 1;

			// Store updated counts
			localStorage.setItem(this.STORAGE_KEYS.SELECTIONS, JSON.stringify(selections));

			console.log(`📊 Selection recorded: ${designId} (${selections[designId]} times)`);

			// Store design metadata for later reference
			this.storeDesignMetadata(designId, designData);

		} catch (error) {
			console.error('❌ Failed to record selection:', error);
		}
	},

	/**
	 * Toggle heart bookmark for a design
	 * @param {string} designId - ID of the design to bookmark
	 * @param {Object} designData - Full design object for reference
	 * @returns {boolean} - New heart state (true if hearted, false if unhearted)
	 */
	toggleHeart(designId, designData) {
		try {
			const hearts = this.getHeartBookmarks();

			if (hearts[designId]) {
				// Remove heart
				delete hearts[designId];
				console.log(`💔 Heart removed: ${designId}`);
			} else {
				// Add heart with timestamp
				// Extract clean title from design name
				const cleanTitle = extractCleanTitle(designData.name);

				hearts[designId] = {
					timestamp: new Date().toISOString(),
					designData: {
						id: designData.id,
						title: cleanTitle,
						url: designData.websiteUrl || designData.url || '#',
						image: designData.image,
						tags: designData.tags
					}
				};
				console.log(`❤️ Heart added: ${designId}`);
			}

			localStorage.setItem(this.STORAGE_KEYS.HEARTS, JSON.stringify(hearts));

			// Store design metadata
			this.storeDesignMetadata(designId, designData);

			return !!hearts[designId];

		} catch (error) {
			console.error('❌ Failed to toggle heart:', error);
			return false;
		}
	},

	/**
	 * Check if a design is hearted
	 * @param {string} designId - ID of the design
	 * @returns {boolean} - True if hearted
	 */
	isHearted(designId) {
		const hearts = this.getHeartBookmarks();
		return !!hearts[designId];
	},

	/**
	 * Get selection counts from localStorage
	 * @returns {Object} - Selection counts by design ID
	 */
	getSelectionCounts() {
		try {
			const data = localStorage.getItem(this.STORAGE_KEYS.SELECTIONS);
			return data ? JSON.parse(data) : {};
		} catch (error) {
			console.error('❌ Failed to get selection counts:', error);
			return {};
		}
	},

	/**
	 * Get heart bookmarks from localStorage
	 * @returns {Object} - Heart bookmarks by design ID
	 */
	getHeartBookmarks() {
		try {
			const data = localStorage.getItem(this.STORAGE_KEYS.HEARTS);
			return data ? JSON.parse(data) : {};
		} catch (error) {
			console.error('❌ Failed to get heart bookmarks:', error);
			return {};
		}
	},

	/**
	 * Store design metadata for later reference
	 * @param {string} designId - Design ID
	 * @param {Object} designData - Design data
	 */
	storeDesignMetadata(designId, designData) {
		try {
			const metadataKey = `thisOrThat_design_${designId}`;

			// Extract clean title from design name
			const cleanTitle = extractCleanTitle(designData.name);

			const metadata = {
				id: designData.id,
				title: cleanTitle,
				url: designData.websiteUrl || designData.url || '#',
				image: designData.image,
				tags: designData.tags,
				lastSeen: new Date().toISOString()
			};

			// Debug logging
			console.log(`💾 Storing metadata for ${designId}:`, {
				originalName: designData.name,
				cleanTitle: cleanTitle,
				websiteUrl: designData.websiteUrl,
				finalUrl: metadata.url
			});
			localStorage.setItem(metadataKey, JSON.stringify(metadata));
		} catch (error) {
			console.error('❌ Failed to store design metadata:', error);
		}
	},

	/**
	 * Get design metadata from localStorage
	 * @param {string} designId - Design ID
	 * @returns {Object|null} - Design metadata or null if not found
	 */
	getDesignMetadata(designId) {
		try {
			const metadataKey = `thisOrThat_design_${designId}`;
			const data = localStorage.getItem(metadataKey);
			const metadata = data ? JSON.parse(data) : null;

			if (!metadata) {
				console.warn(`⚠️ No metadata found for design ${designId}`);
			} else if (!metadata.title || metadata.title === 'Untitled Design') {
				console.warn(`⚠️ Design ${designId} has no title or default title:`, metadata);
			} else if (!metadata.url || metadata.url === '#') {
				console.warn(`⚠️ Design ${designId} has no URL or default URL:`, metadata);
			}

			return metadata;
		} catch (error) {
			console.error('❌ Failed to get design metadata:', error);
			return null;
		}
	},

	/**
	 * Get top 5 favorite designs based on selection count and hearts
	 * @returns {Array} - Array of top 5 favorite designs with metadata
	 */
	getTopFavorites() {
		try {
			const selections = this.getSelectionCounts();
			const hearts = this.getHeartBookmarks();

			// Create combined favorites list
			const favorites = [];

			// Process selection counts (minimum 2 selections required)
			Object.keys(selections).forEach(designId => {
				const selectionCount = selections[designId];
				if (selectionCount >= 2) {
					const metadata = this.getDesignMetadata(designId);
					if (metadata) {
						console.log(`📊 Processing favorite ${designId}:`, metadata);
						favorites.push({
							designId,
							selectionCount,
							isHearted: !!hearts[designId],
							heartTimestamp: hearts[designId]?.timestamp,
							title: metadata.title || 'Untitled Design',
							url: metadata.url || '#',
							image: metadata.image,
							tags: metadata.tags,
							// Scoring: selections + heart bonus
							score: selectionCount + (hearts[designId] ? 10 : 0)
						});
					} else {
						console.warn(`⚠️ No metadata found for design ${designId} with ${selectionCount} selections`);
					}
				}
			});

			// Add hearted designs that might not have 2+ selections
			Object.keys(hearts).forEach(designId => {
				const selectionCount = selections[designId] || 0;

				// Only add if not already in favorites list
				if (!favorites.find(f => f.designId === designId)) {
					const heartData = hearts[designId];
					if (heartData && heartData.designData) {
						console.log(`❤️ Processing hearted design ${designId}:`, heartData.designData);
						favorites.push({
							designId,
							selectionCount,
							isHearted: true,
							heartTimestamp: heartData.timestamp,
							title: heartData.designData.title || 'Untitled Design',
							url: heartData.designData.url || '#',
							image: heartData.designData.image,
							tags: heartData.designData.tags,
							// Heart-only designs get base score of 5
							score: selectionCount + 5
						});
					} else {
						console.warn(`⚠️ No heart data found for design ${designId}`);
					}
				}
			});

			// Sort by score (descending), then alphabetically by title for ties
			favorites.sort((a, b) => {
				if (b.score !== a.score) {
					return b.score - a.score;
				}
				// Alphabetical sort for ties
				return (a.title || '').localeCompare(b.title || '');
			});

			// Return top 5
			const top5 = favorites.slice(0, 5);

			console.log(`🏆 Top ${top5.length} favorites calculated:`, top5.map(f =>
				`${f.title} (${f.selectionCount} selections${f.isHearted ? ' + ❤️' : ''})`
			));

			return top5;

		} catch (error) {
			console.error('❌ Failed to get top favorites:', error);
			return [];
		}
	},

	/**
	 * Get favorites statistics
	 * @returns {Object} - Statistics about user favorites
	 */
	getStatistics() {
		try {
			const selections = this.getSelectionCounts();
			const hearts = this.getHeartBookmarks();

			const stats = {
				totalDesignsSelected: Object.keys(selections).length,
				totalSelections: Object.values(selections).reduce((sum, count) => sum + count, 0),
				totalHearted: Object.keys(hearts).length,
				designsWithMultipleSelections: Object.values(selections).filter(count => count >= 2).length,
				mostSelectedCount: Math.max(...Object.values(selections), 0),
				averageSelectionsPerDesign: 0
			};

			if (stats.totalDesignsSelected > 0) {
				stats.averageSelectionsPerDesign = Number((stats.totalSelections / stats.totalDesignsSelected).toFixed(1));
			}

			return stats;

		} catch (error) {
			console.error('❌ Failed to get statistics:', error);
			return {
				totalDesignsSelected: 0,
				totalSelections: 0,
				totalHearted: 0,
				designsWithMultipleSelections: 0,
				mostSelectedCount: 0,
				averageSelectionsPerDesign: 0
			};
		}
	},

	/**
	 * Clear all favorites data
	 */
	clearAllData() {
		try {
			// Clear main storage
			localStorage.removeItem(this.STORAGE_KEYS.SELECTIONS);
			localStorage.removeItem(this.STORAGE_KEYS.HEARTS);

			// Clear design metadata
			const keys = Object.keys(localStorage);
			keys.forEach(key => {
				if (key.startsWith('thisOrThat_design_')) {
					localStorage.removeItem(key);
				}
			});

			console.log('🧹 All favorites data cleared');

		} catch (error) {
			console.error('❌ Failed to clear favorites data:', error);
		}
	},

	/**
	 * Migrate old metadata to new format (for debugging/fixing old data)
	 * @param {Array} allDesigns - Array of all design objects from the current data
	 */
	migrateMetadata(allDesigns) {
		try {
			console.log('🔄 Migrating metadata to new format...');

			// Get all stored metadata keys
			const metadataKeys = Object.keys(localStorage).filter(key => key.startsWith('thisOrThat_design_'));

			metadataKeys.forEach(key => {
				const designId = key.replace('thisOrThat_design_', '');

				// Find the current design data
				const currentDesign = allDesigns.find(d => d.id === designId);
				if (currentDesign) {
					// Re-store with current data structure
					this.storeDesignMetadata(designId, currentDesign);
					console.log(`✅ Migrated metadata for ${designId}`);
				} else {
					// Remove metadata for designs that no longer exist
					localStorage.removeItem(key);
					console.log(`🗑️ Removed metadata for missing design ${designId}`);
				}
			});

			console.log('✅ Metadata migration completed');

		} catch (error) {
			console.error('❌ Failed to migrate metadata:', error);
		}
	},

	/**
	 * Export favorites data for backup/sharing
	 * @returns {Object} - Complete favorites data
	 */
	exportData() {
		try {
			return {
				selections: this.getSelectionCounts(),
				hearts: this.getHeartBookmarks(),
				statistics: this.getStatistics(),
				exportedAt: new Date().toISOString()
			};
		} catch (error) {
			console.error('❌ Failed to export data:', error);
			return null;
		}
	}
};

// Initialize when loaded
if (typeof window !== 'undefined') {
	window.FavoritesManager = FavoritesManager;

	// Add a global function to fix favorites data
	window.fixFavoritesData = function () {
		console.log('🔧 Fixing favorites data...');
		FavoritesManager.clearAllData();
		console.log('✅ Favorites data cleared. Start making selections to rebuild your favorites!');
		alert('Favorites data has been cleared. Start making selections to rebuild your favorites!');
	};

	// Auto-initialize when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', () => FavoritesManager.init());
	} else {
		FavoritesManager.init();
	}
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
	module.exports = FavoritesManager;
}