# Data Merge Scripts

This directory contains scripts for merging newly scraped design data into the main `data/designs.json` file and copying associated images.

## Scripts Overview

### 1. `merge-scraped-data.js` - Main Merge Script

The primary script for merging scraped JSON data into the main designs database.

**Usage:**

```bash
node merge-scraped-data.js <scraped-file.json>
```

**Example:**

```bash
node merge-scraped-data.js scrape-saved-html/scraped-designs.json
```

**Features:**

- ✅ Merges new designs into main `data/designs.json`
- ✅ Updates existing designs with new data
- ✅ Copies images from scraped directory to `data/images/`
- ✅ Creates automatic backups before merging
- ✅ Intelligent tag merging (combines and deduplicates)
- ✅ Comprehensive error handling and reporting
- ✅ Detailed merge statistics

### 2. `merge-helper.js` - Interactive Helper

An interactive helper that automatically finds and selects the most recent scraped file.

**Usage:**

```bash
node merge-helper.js
```

**Features:**

- 📁 Auto-discovers JSON files in `scrape-saved-html/`
- 🕒 Shows file modification times and metadata
- 🎯 Auto-selects the most recent file
- 📊 Displays design counts and scrape information

### 3. `validate-merged-data.js` - Data Validation

Validates the integrity of the merged data and checks for common issues.

**Usage:**

```bash
node validate-merged-data.js
```

**Features:**

- 🔍 Validates JSON structure and required fields
- 🖼️ Checks that all referenced images exist
- 🆔 Detects duplicate design IDs
- 📊 Provides comprehensive validation report

## Merge Process

### What Gets Merged

1. **New Designs**: Designs with IDs not in the main database are added
2. **Existing Designs**: Designs with matching IDs are updated with new data
3. **Tags**: Tag arrays are merged and deduplicated intelligently
4. **Images**: Image files are copied to the main `data/images/` directory
5. **Metadata**: Main metadata is updated with merge statistics

### Data Preservation

- Existing design data is preserved when not present in scraped data
- Tags are merged (not replaced) to preserve existing categorization
- Original timestamps and metadata are maintained
- Automatic backups prevent data loss

### Image Handling

- Images are copied from the scraped directory to `data/images/`
- Existing images with the same name and size are skipped
- Failed image copies are logged but don't stop the merge process
- Relative paths in scraped data are resolved correctly

## File Structure

```
data/
├── designs.json          # Main design database
├── images/              # All design images
└── backups/             # Automatic backups
    └── designs-backup-[timestamp].json

scrape-saved-html/       # Scraped data directory
├── scraped-designs.json # Example scraped file
├── yoga_files/          # Example image directory
└── ...
```

## Example Workflow

1. **Run a scraper** to generate new JSON data:

   ```bash
   # Your scraping process creates: scrape-saved-html/new-designs.json
   ```

2. **Merge the data**:

   ```bash
   node merge-scraped-data.js scrape-saved-html/new-designs.json
   ```

3. **Validate the results**:

   ```bash
   node validate-merged-data.js
   ```

4. **Check the summary**:

   ```
   📊 Merge Summary:
   ================
   New designs added: 15
   Existing designs updated: 3
   Images copied: 18
   ✅ Merge completed successfully!
   ```

## Error Handling

The scripts include comprehensive error handling:

- **File not found**: Clear error messages for missing files
- **JSON parsing errors**: Detailed parsing error information
- **Image copy failures**: Logged but don't stop the merge
- **Backup failures**: Warned but don't prevent merging
- **Validation issues**: Detailed reports of data integrity problems

## Backup System

- Automatic backups are created before each merge
- Backups are stored in `data/backups/` with timestamps
- Backup format: `designs-backup-YYYY-MM-DDTHH-MM-SS-sssZ.json`
- No automatic cleanup (manual management required)

## Best Practices

1. **Always validate** after merging: `node validate-merged-data.js`
2. **Check merge statistics** to ensure expected results
3. **Keep scraped directories** until merge is confirmed successful
4. **Monitor backup directory size** and clean up old backups periodically
5. **Test with small datasets** before merging large scrapes

## Troubleshooting

### Common Issues

**"Scraped file not found"**

- Check the file path is correct
- Ensure the file exists and is readable

**"Failed to copy image"**

- Check that source images exist in the scraped directory
- Verify file permissions
- Check available disk space

**"Duplicate ID found"**

- Run validation to identify duplicate IDs
- Manually resolve duplicates before merging

**"Missing required fields"**

- Check scraped data format matches expected structure
- Ensure required fields (id, name/title) are present

### Recovery

If a merge goes wrong:

1. Stop the process (Ctrl+C)
2. Restore from the automatic backup in `data/backups/`
3. Fix the issue in the scraped data
4. Re-run the merge

## Version History

- **v1.0.0** - Initial merge script implementation
- Added comprehensive error handling and validation
- Implemented intelligent tag merging
- Added automatic backup system
