const { error } = require('console');
const csv = require('csv-parser');
const fs = require('fs');

function parseCSV(filePath, parsedFilesPath, archivePath) {
    return new Promise((resolve, reject) => {
        const results = []; // Array to hold parsed data
        fs.createReadStream(filePath)
            .pipe(csv({ skipComments: true }))
            .on('data', (data) => results.push(data)) // Push each row of data into the results array
            .on('end', () => {
                fs.writeFile(parsedFilesPath, JSON.stringify(results), "utf-8", (error) => {
                    if (error) console.log(error.message);
                });
                resolve(results); // Resolve the promise with the parsed data
                fs.renameSync(filePath, archivePath);
            })
            .on('error', (error) => {
                reject(error); // Reject the promise if there's an error
            });
    });
};

module.exports = parseCSV;