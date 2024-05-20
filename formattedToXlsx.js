const XLSX = require('xlsx');
const path = require('path');

// Get the competitor name from the command line arguments
const targetName = process.argv[2];

// Construct the paths to the input and output files
const inputFilePath = path.join(__dirname, 'formatted', `${targetName}Formatted.json`);
const outputFilePath = path.join(__dirname, 'excelFiles', `${targetName}.xlsx`);

// Load the data from the input file
const data = require(inputFilePath);

// Convert the data to a worksheet and add it to a new workbook
const worksheet = XLSX.utils.json_to_sheet(data);
const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

// Write the workbook to the output file
XLSX.writeFile(workbook, outputFilePath);