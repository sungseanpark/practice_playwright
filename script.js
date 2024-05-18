const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

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
    const inputFilename = process.argv[2];
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


        const units = await page.$$eval('div[data-tab-content-id="all"] li.unitContainer.js-unitContainer', all_units =>{
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
        const outputFilename = process.argv[3];
        // Prepend the directory name to the output filename
        const outputFilePath = path.join('outputs', outputFilename);
        fs.writeFile(outputFilePath, JSON.stringify(all_data, null, 2), (err) => {
            if (err) {
                console.error('An error occurred while writing to the file:', err);
            } else {
                console.log('Data written to file successfully');
            }
        });
    }).catch((error) => {
        console.error('An error occurred:', error);
    });
})();