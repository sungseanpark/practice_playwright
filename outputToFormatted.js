const fs = require('fs');
const path = require('path');

 // Use the third command line argument as the name of the text file
 const inputFilename = process.argv[2] + 'Output.json';
 // Prepend the directory name to the filename
 // const inputFilePath = path.join('links', inputFilename);

// Load the JSON data from the output.json file
const data = JSON.parse(fs.readFileSync(path.join('outputs', inputFilename), 'utf-8'));

all_transformedData = [];

const date = new Date();
const dateToday = `${date.getMonth() + 1}/${date.getDate()}`;

data.forEach(property => {

    // console.log(data)

    // Initialize an empty object to store the transformed data
    const transformedData = {
        propertyName: property.propertyName,
    };

    // Iterate over the units array
    let vacancy = property.units.map(unit => {
        // Use the bed property as the key and the count property as the value
        // If bed is "0", replace it with "Studio"
        const key = unit.bed === "0" ? "Studio" : `${unit.bed} bed`;
        return `${key}: ${unit.count}`;
    }).join('\n');

    // Calculate the percent (you'll need to replace this with your own calculation)
    // let percent = "3.4"; // replace with your own calculation
    vacancy += `\nPercent: %`;

    transformedData["Vacancy"] = vacancy;
    transformedData["moveInSpecials"] = property.moveInSpecials ? property.moveInSpecials : "none";
    //console.log(transformedData);

    for(let i = 0; i < 4; i++){
        const key = i === 0 ? "Studio" : `${i} bed`;
        if(property.units.some(unit => unit.bed == i)) {
            // Format the data if there is an object with bed equal to i
            const unit = property.units.find(unit => unit.bed == i);
            let priceRange="";
            if(unit.minPrice == unit.maxPrice){
                priceRange += `$${unit.minPrice}`;
            }
            else{
                priceRange = `$${unit.minPrice}-${unit.maxPrice}`;
            }
            let psfRange="";
            if(!unit.minPSF){
                psfRange = "";
            }
            else if(unit.minPSF == unit.maxPSF){
                psfRange += `\n($${unit.minPSF})`;
            }
            else{
                psfRange = `\n($${unit.minPSF}-${unit.maxPSF})`;
            }
            transformedData[key] = `${dateToday}: ${priceRange}${psfRange}`;
        } else {
            // If not, put "n/a"
            transformedData[key] = "n/a";
        }
    }

    all_transformedData.push(transformedData);
});

const outputFilename = process.argv[2] + 'Formatted.json';
        // Prepend the directory name to the output filename
const outputFilePath = path.join('formatted', outputFilename);
fs.writeFile(outputFilePath, JSON.stringify(all_transformedData, null, 2), (err) => {
    if (err) {
        console.error('An error occurred while writing to the file:', err);
    } else {
        console.log('Data written to file successfully');
    }
});