const fs = require('fs');
const path = require('path');

 // Use the third command line argument as the name of the text file
 const inputFilename = process.argv[2];
 // Prepend the directory name to the filename
 // const inputFilePath = path.join('links', inputFilename);

// Load the JSON data from the output.json file
const data = JSON.parse(fs.readFileSync(path.join('outputs', inputFilename), 'utf-8'));

// console.log(data)

// Initialize an empty object to store the transformed data
const transformedData = {
    propertyName: data[0].propertyName,
};

// Iterate over the units array
let vacancy = data[0].units.map(unit => {
    // Use the bed property as the key and the count property as the value
    // If bed is "0", replace it with "Studio"
    const key = unit.bed === "0" ? "Studio" : `${unit.bed} bed`;
    return `${key}: ${unit.count}`;
}).join('\n');

// Calculate the percent (you'll need to replace this with your own calculation)
// let percent = "3.4"; // replace with your own calculation
vacancy += `\nPercent: %`;

transformedData["Vacancy"] = vacancy;
transformedData["moveInSpecials"] = data[0].moveInSpecials;
console.log(transformedData);

const outputFilename = process.argv[3];
        // Prepend the directory name to the output filename
const outputFilePath = path.join('formattedJsons', outputFilename);
fs.writeFile(outputFilePath, JSON.stringify(transformedData, null, 2), (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('Data written to file successfully');
    }
});