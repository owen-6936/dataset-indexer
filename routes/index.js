const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto')
const parseCSV = require('../utils/csvparser');
const JSONStream = require('jsonstream');

const uploadDir = path.join(__dirname, '..', '..', 'data_storage', 'raw_uploads');
const parsedFilesDir = path.join(__dirname, '..', '..', 'data_storage', 'parsed_files');
const archiveDir = path.join(__dirname, '..', '..', 'data_storage', 'archive');

async function ensureAccesstoDirs() {
    console.log('Ensuring access to data directories...');
    const dirs = [uploadDir, parsedFilesDir, archiveDir]
    for (const dir of dirs) {
        try {
            // Ensure the directory exists (recursive: true creates parent directories too)
            await fs.promises.mkdir(dir, { recursive: true });
            console.log(`Directory ensured: ${dir}`);

            // Check for read and write access
            await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
            console.log(`Read/Write access confirmed for: ${dir}`);

        } catch (error) {
            console.warn(`Access denied or error for directory: ${dir}. Attempting to set permissions...`, error.message);

            try {
                // Attempt to set read and write permissions for the current user
                await fs.promises.chmod(dir, fs.constants.S_IRUSR | fs.constants.S_IWUSR);
                console.log(`Attempted to set read/write permissions for: ${dir}`);

                // Re-check access after attempting to set permissions
                await fs.promises.access(dir, fs.constants.R_OK | fs.constants.W_OK);
                console.log(`Read/Write access confirmed after setting permissions for: ${dir}`);

            } catch (chmodError) {
                console.error(`Failed to set permissions or confirm access for directory: ${dir}`, chmodError.message);
                // If setting permissions also fails, this is a critical error.
                throw new Error(`Critical error: Unable to access or set permissions for directory: ${dir}`);
            }
        }
    }
    console.log('Access ensured for all specified directories.');
}

// Configure Multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Sets the destination directory
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Sets the file name to prevent overwrites and keep original extension
        const uuid = randomBytes(6).toString('hex')
        cb(null, uuid + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });
// GET route for the main workshop page
router.get('/', (req, res) => {
    fs.readdir(uploadDir, (err, files) => {
        const fileList = files ? files.map(fileName => ({ name: fileName, type: 'raw', size: '?' })) : [];
        res.render('index', {
            pageTitle: 'Raw Dataset Converter (CSV - JSON)',
            files: fileList // Pass the list of files to the EJS template
        });
    });
});

router.get('/layout/indexer.ejs', (req, res) => {
    fs.readdir(parsedFilesDir, (err, files) => {
        const fileList = files ? files.map(fileName => ({ name: fileName, type: 'json' })) : [];
        res.render('layout/indexer.ejs', {
            pageTitle: 'Dataset Workshop',
            files: fileList // Pass the list of files to the EJS template
        });
    });
});

router.get('/layout/indexViewer.ejs', (req, res) => {
    res.render('layout/indexViewer.ejs', {
        pageTitle: 'Index Viewer',
        files: [] // Pass the list of files to the EJS template
    });
});


router.post('/upload', upload.single("datasetFile"), (req, res) => {
    // Handle file upload
    const uploadedFile = req.file;

    if (!uploadedFile) {
        // If req.file is undefined, no file was uploaded or the field name was wrong
        return res.status(400).send('No file was uploaded or the field name is incorrect.');
    }

    // File was successfully uploaded to uploadDir
    console.log('File uploaded successfully:', uploadedFile);
    res.redirect('/');
});

router.post('/convert-csv-to-json', (req, res) => {
    const { filename } = req.body;
    const fullpath = `${uploadDir}\\${filename}`;
    const jsonPath = parsedFilesDir + "\\" + filename.replace(".csv", ".json");
    if (fs.existsSync(fullpath)) parseCSV(fullpath, jsonPath, archiveDir.concat("\\", filename));
    else res.status(404).json({ error: "invalid file path" });
    res.status(200).json({ message: "your csv file has been converted to json", path: jsonPath, archive: archiveDir + "\\" + filename });
})

router.get('/index-field/:filename', (req, res) => {
    const filename = req.params.filename;
    const fileDir = path.join(parsedFilesDir, filename);

    if (fs.existsSync(fileDir)) {
        // Create a readable stream from the file
        const reader = fs.createReadStream(fileDir, { encoding: 'utf8' });
        // Create a JSONStream parser for items in a top-level array
        const parser = JSONStream.parse('*');

        // Pipe the file stream to the parser
        reader.pipe(parser);

        let firstObjectProcessed = false; // Flag to ensure we only process the first object

        // Listen for data (complete objects) from the parser
        parser.on('data', obj => {
            // Process only the first object received
            if (!firstObjectProcessed) {
                firstObjectProcessed = true; // Mark as processed

                console.log(`Found first object in ${filename}.`);

                try {
                    // Get keys from the first object
                    const objectKeys = Object.keys(obj);

                    // Send the response with the keys
                    if (!res.headersSent) {
                        res.json({ objectKeys });
                    }

                    // Destroy both streams immediately after processing the first object
                    reader.destroy();
                    parser.destroy();

                } catch (e) {
                    // Handle potential errors getting keys or sending response
                    console.error(`Error processing first object from ${filename}:`, e);
                    if (!res.headersSent) {
                        res.status(500).json({ error: `Failed to process first object: ${e.message}` });
                    }
                    reader.destroy();
                    parser.destroy();
                }
            }
            // Subsequent objects emitted by the parser are ignored due to the flag
        });

        // Handle errors on the file stream
        reader.on('error', (err) => {
            console.error(`File stream error for ${filename}:`, err);
            if (!res.headersSent) {
                res.status(500).json({ error: `File reading failed: ${err.message}` });
            }
            // Ensure parser is also destroyed on file error
            parser.destroy();
        });

        // Handle errors on the parser stream (JSON parsing errors)
        parser.on('error', (err) => {
            console.error(`JSON parsing error for ${filename}:`, err);
            if (!res.headersSent) {
                res.status(500).json({ error: `JSON parsing failed: ${err.message}` });
            }
            // Ensure file stream is also destroyed on parser error
            reader.destroy();
        });


        // Handle end of stream - important if the file is empty or has no objects
        parser.on('end', () => {
            console.log(`End of stream for ${filename}.`);
            // If the stream ends but we never processed the first object,
            // it means the file was empty or did not contain any parseable objects.
            if (!firstObjectProcessed && !res.headersSent) {
                console.log(`File ${filename} ended without finding a complete JSON object.`);
                res.status(400).json({ error: "File did not contain a complete JSON object." });
            }
        });


    } else {
        // File not found
        res.status(404).json({ error: "File not found." });
    }
});

module.exports = { router, ensureAccesstoDirs };
