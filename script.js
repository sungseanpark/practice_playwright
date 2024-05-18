const playwright = require('playwright');

(async() =>{
    const launchOptions = {
        headless: false,
        // proxy: {
        //    server: 'http://us-pr.oxylabs.io:10000',
        //    username: 'USERNAME',
        //    password: 'PASSWORD'
        // }
    };
    const browser = await playwright.chromium.launch(launchOptions);
    const page = await browser.newPage();
    await page.goto('https://www.apartments.com/hallasan-los-angeles-ca/n7jh9pm/');
    await page.waitForTimeout(5000);

    const moveInSpecials = await page.$eval('.rentSpecialsSection', specialContainer => {

        const specialTextEl = specialContainer.querySelector('p.copy');
        const specialText = specialTextEl ? specialTextEl.innerText : null;

        return specialText
    });

    console.log(moveInSpecials);


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

    console.log(units)

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
    console.log(result);

    await browser.close();
})();