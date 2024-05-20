const playwright = require('playwright');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

(async() =>{
    const launchOptions = {
        headless: false,
        // proxy: {
        //    server: 'http://us-pr.oxylabs.io:10000',
        //    username: 'USERNAME',
        //    password: 'PASSWORD'
        // }
    };

    // Use the third command line argument as the name of the text file
    const targetName = process.argv[2];
    const inputFilename = targetName + 'Links.txt';
    // Prepend the directory name to the filename
    const inputFilePath = path.join('links', inputFilename);
    const links = fs.readFileSync(inputFilePath, 'utf-8').split('\n');

    const all_data = [];
    Promise.all(links.map(async (link) => {
        const browser = await playwright.chromium.launch(launchOptions);
        const page = await browser.newPage();
        await page.goto(link, { timeout: 180000 }); 
        await page.waitForTimeout(5000);

        const propertyName = await page.$eval('#propertyName', name => name.innerText);
        // console.log(propertyName);

        const rentSpecialsSection = await page.$('.rentSpecialsSection');
        let moveInSpecials = null;

        if (rentSpecialsSection !== null) {
            moveInSpecials = await page.$eval('.rentSpecialsSection', specialContainer => {
                const specialTextEl = specialContainer.querySelector('p.copy');
                return specialTextEl ? specialTextEl.innerText : null;
            });
        }

        // console.log(moveInSpecials);


        const units = await page.$$eval('div[data-tab-content-id="all"] li.unitContainer', all_units =>{
            const data = [];
            all_units.forEach(unit => {
                const unitNumEl = unit.querySelector('.unitColumn.column').querySelector('span[title]')
                const unitNum = unitNumEl ? unitNumEl.innerText : null;
                const priceEl = unit.querySelector('.pricingColumn.column').querySelector('span[data-unitname]')
                const price = priceEl ? priceEl.innerText.replace(/\D/g, '') : null;
                const sqftEl = unit.querySelector('.sqftColumn.column').querySelector('span:not(.screenReaderOnly)')
                const sqft = sqftEl ? sqftEl.innerText : null;
                const bed = unit.getAttribute('data-beds');




                data.push({unitNum, price, sqft, bed})
            })
            return data
        })

        // console.log(units)

        let transformedData = {};

        units.forEach(unit => {
            let price = Number(unit.price);
            let sqft = Number(unit.sqft.replace(/,/g, ''));
            let psf = isNaN(price) || isNaN(sqft) ? null : (price / sqft).toFixed(2);
        
            if (!transformedData[unit.bed]) {
                transformedData[unit.bed] = {
                    bed: unit.bed,
                    count: 0,
                    minPrice: isNaN(price) ? Infinity : price,
                    maxPrice: isNaN(price) ? -Infinity : price,
                    minPSF: psf === null ? Infinity : psf,
                    maxPSF: psf === null ? -Infinity : psf
                };
            }
        
            transformedData[unit.bed].count++;
        
            if (!isNaN(price)) {
                transformedData[unit.bed].minPrice = Math.min(transformedData[unit.bed].minPrice, price);
                transformedData[unit.bed].maxPrice = Math.max(transformedData[unit.bed].maxPrice, price);
            }
        
            if (psf !== null) {
                transformedData[unit.bed].minPSF = Math.min(transformedData[unit.bed].minPSF, psf);
                transformedData[unit.bed].maxPSF = Math.max(transformedData[unit.bed].maxPSF, psf);
            }
        });

        let result = Object.values(transformedData);
        // console.log(result);

        let data = {
            propertyName,
            moveInSpecials,
            units: result
        };

        //console.log(data);

        all_data.push({
            propertyName,
            moveInSpecials,
            units: result
        });

        await browser.close();

    })).then(() => {
        console.log('All links processed');
        
        // Use the fourth command line argument as the name of the output file
        // const outputFilename = process.argv[2] + 'Output.json';
        // // Prepend the directory name to the output filename
        // const outputFilePath = path.join('outputs', outputFilename);
        // fs.writeFile(outputFilePath, JSON.stringify(all_data, null, 2), (err) => {
        //     if (err) {
        //         console.error('An error occurred while writing to the file:', err);
        //     } else {
        //         console.log('Data written to file successfully');
        //     }
        // });
        all_transformedData = [];
        const date = new Date();
        const dateToday = `${date.getMonth() + 1}/${date.getDate()}`;
        all_data.forEach(property => {

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

        const outputFilePath = path.join(__dirname, 'excelFiles', `${targetName}.xlsx`);

        // Convert the data to a worksheet and add it to a new workbook
        const worksheet = XLSX.utils.json_to_sheet(all_transformedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

        // Write the workbook to the output file
        XLSX.writeFile(workbook, outputFilePath);



        
    }).catch((error) => {
        console.error('An error occurred:', error);
    });
})();