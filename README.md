# dataset-indexer

## Project Description

dataset-indexer is a Node.js application designed to process large datasets from various formats (starting with JSON and CSV), index them based on multiple criteria (like alphabetical order, genres, years), and provide a web-based "workshop" interface for managing and exploring the indexed data.

The primary goal is to efficiently handle datasets that are too large to fit into memory all at once, allowing for quick filtering and retrieval without loading the entire dataset.

## Features

* Processing of large input files (JSON, CSV).
* Creation of smaller, manageable data part files.
* Building of lightweight index files for different criteria (e.g., by genre, by year).
* Web interface (built with Express and EJS) to interact with the indexing process and view results.

## Technology Stack

* **Backend Runtime:** Node.js
* **Web Framework:** Express.js
* **Templating Engine:** EJS
* **File Handling:** Node.js built-in `fs` module (streams) & `readline`
* **CSV Parsing:** [`csv-parser`](https://www.npmjs.com/package/csv-parser) (Recommended) or similar library
* **Index Storage:** File System (JSON files)
  
## Project Status

Currently under initial development.

## Future Enhancements

* Support for more data formats.
* More advanced indexing options.
* Improved user interface features.
* (Add your own ideas here)

## Author

[Owen Erhabor]

## License

Apache License 2.0
