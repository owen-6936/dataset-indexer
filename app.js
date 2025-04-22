const express = require('express');
const port = process.env.PORT || 3000;
const { ensureAccesstoDirs, router } = require('./routes/index');

// ensures read and write access for compulsory folders
ensureAccesstoDirs()
    .then(() => {
        console.log('Application directories are ready.');

        // creating an express application
        const app = express();

        // incorporating middlewares
        app.set('view engine', 'ejs');
        app.set('views', __dirname + '/views');
        app.use(express.static("./public"));
        app.use(express.urlencoded({ extended: true }))
        app.use(express.json());
        app.use("/", router);

        //starting up the server
        app.listen(port, () => {
            console.log(`Starting server on port ${port}`);
        })
    })
    .catch(error => {
        console.error('Application failed to start due to directory access issues:', error);
        process.exit(1); // Exits the process if essential directories are inaccessible
    });
