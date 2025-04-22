const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto')
const parseCSV = require('../utils/csvparser');

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

module.exports = { router, ensureAccesstoDirs };
