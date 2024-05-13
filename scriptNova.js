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
    await page.goto('https://www.apartments.com/nova-apartments-on-wilshire-los-angeles-ca/e1sx1nq/');
    await page.waitForTimeout(5000);

    const moveInSpecials = await page.$eval('.moveInSpecialsContainer', specialContainer => {
        // const data = [];
        // all_products.forEach(product => {
        //     const titleEl = product.querySelector('.a-size-base-plus');
        //     const title = titleEl ? titleEl.innerText : null;
        //     const priceEl = product.querySelector('.a-price');
        //     const price = priceEl ? priceEl.innerText : null;
        //     const ratingEl = product.querySelector('.a-icon-alt');
        //     const rating = ratingEl ? ratingEl.innerText : null;
        //     data.push({ title, price, rating});
        // });
        // return data;

        const specialTextEl = specialContainer.querySelector('p');
        const specialText = specialTextEl ? specialTextEl.innerText : null;

        return specialText
    });

    console.log(moveInSpecials);

    // const unitTypes = await page.$$eval('.tabHeader.screen.multifamily > li > button', all_unitTypeButtons => {
    //     const data = [];
    //     all_unitTypeButtons.forEach(unitTypeButton => {
    //         const unitType = unitTypeButton.innerText;
    //         data.push({unitType})
    //         unitTypeButton.click();
    //         await page.$$eval('.js-priceGridShowMoreLabel', all_showMoreButtons => {
    //             all_showMoreButtons.forEach(showMoreButton => {
    //                 showMoreButton.click()
    //             });
    //         });
            
    //     })
    //     return data
    // });
    
    // const divWithIdAll = await page.querySelector('div[data-tab-content-id="all"]');

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

    await browser.close();
})();