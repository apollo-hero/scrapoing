const browserObject = require('./browser');

//Start the browser and create a browser instance
let browserInstance = browserObject.startBrowser();

const search = async (req, res) => {
    let browser = await browserInstance;
    const item = req.query;console.log(item);
    let searchPage = await browser.newPage();
    await searchPage.setDefaultNavigationTimeout(0);
    console.log(`Navigating to searchPage...`);
    await searchPage.goto('https://suchen.mobile.de/fahrzeuge/search.html?dam=0&sb=rel&vc=Car');
    var make = item.brand.trim().split(" ");

    let temp_model = "";
    switch(make[0]) {
        case "Citroen":
            temp_model = "Citroën";
          break;
        case "220I GRAN":
          // code block
          temp_model = "220 GRAN";
          break;
        default:
          // code block
          temp_model = make[0];
      }
    
    temp_model = temp_model.toUpperCase();

    let makeCode = await searchPage.$$eval('#selectMake1-ds > option', (links, t) => {
        // Make sure the book to be scraped is in stock
        links = links.filter(link => link.textContent.trim().toUpperCase() == t)
        // Extract the links from the data
        links = links.map(el => el.value);
        return links;
    }, temp_model);

   let makeCode1 = await searchPage.$$eval('#selectMake1-ds > option', (links, t) => {
        // Make sure the book to be scraped is in stock
        links = links.filter(link => link.textContent.trim().toUpperCase() == t)
        // Extract the links from the data
        links = links.map(el => el.value);
        return links;
    }, make[0] + " " + make[1]);

    if(makeCode1.length != 0){
	makeCode = makeCode1;
    }

    console.log("code:", makeCode);
    await searchPage.select('#selectMake1-ds', makeCode[0]);

    await searchPage.waitForSelector("#selectModel1-ds > option");
    let model = make[1].toUpperCase();
    let modelCode = await searchPage.$$eval('#selectModel1-ds > option', (links, t) => {
        // Make sure the book to be scraped is in stock
        links = links.filter(link => link.textContent.trim().toUpperCase() == t)
        // Extract the links from the data
        links = links.map(el => el.value);
        return links;
    }, model);
    console.log(modelCode);
    let model1 = (make[1] + " " + make[2]).toUpperCase();

    switch(model1) {
        case "PRO CEED":
            model1 = "pro cee'd / ProCeed";
          break;
        case "220I GRAN":
          // code block
          model1 = "220 GRAN";
          break;
        default:
          // code block
      }
    let modelCode1 = await searchPage.$$eval('#selectModel1-ds > option', (links, t) => {
        // Make sure the book to be scraped is in stock
        links = links.filter(link => link.textContent.trim().toUpperCase() == t)
        // Extract the links from the data
        links = links.map(el => el.value);
        return links;
    }, model1);
    let model2 = (model1 + " " + make[3]).toUpperCase();
    let modelCode2 = await searchPage.$$eval('#selectModel1-ds > option', (links, t) => {
        // Make sure the book to be scraped is in stock
        links = links.filter(link => link.textContent.trim().toUpperCase() == t)
        // Extract the links from the data
        links = links.map(el => el.value);
        return links;
    }, model2);

    if (modelCode1.length != 0) {
        console.log(typeof modelCode1);
        modelCode = modelCode1;
    } else if (modelCode2.length != 0) {
        modelCode = modelCode2;
    }

    console.log("code:", modelCode, modelCode1, modelCode2, model, model1, model2);
    await searchPage.select('#selectModel1-ds', modelCode[0]);

    //console.log("code:",modelCode);
    //await searchPage.select('#selectModel1-ds', modelCode[0]);
    var variant = make[make.length - 3] + " " + make[make.length - 2];
    await searchPage.$eval('#modelDescription1-ds', (el, t) => el.value = t, variant);
    if (item.type == " Kombi") {
        await searchPage.$eval('#categories-EstateCar-ds', check => check.checked = true);
        // searchPage.click('#categories-EstateCar-ds');
    }
    // if(item.type == " Kombi"){
    //  page.click('#categories-EstateCar-ds');
    // }

    var year = item.date.trim().split(".");
    await searchPage.$eval('#minFirstRegistrationDate', (el, t) => el.value = t[2], year);
    var seat = item.seat.trim().split(" ");
    // await searchPage.$eval('#minSeats', (el, t) => el.value = t[0], seat);
    // await searchPage.$eval('#maxSeats', (el, t) => el.value = t[0], seat);
    var door = item.door.trim().split(" ")[0];
    var value;
    if (door == '2' || door == '3') {
        value = "TWO_OR_THREE";
    } else if (door == '4' || door == '5') {
        value = "FOUR_OR_FIVE";
    } else if (door == '6' || door == '7') {
        value = "SIX_OR_SEVEN";
    }
    //await searchPage.select('#doorCount-ds', value);
    var mile = item.mile.trim().split(" ");
    await searchPage.$eval('#minMileage', (el, t) => el.value = t[0], mile);

    if (item.fuel.trim() == "Diesel") {
        // searchPage.click('#fuels-DIESEL-ds');
        await searchPage.$eval('#fuels-DIESEL-ds', check => check.checked = true);
    }

    // if(item.fuel == " Diesel"){
    //  // searchPage.click('#fuels-DIESEL-ds');
    //  await searchPage.$eval('#fuels-DIESEL-ds', check => check.checked = true);
    // }
    var hp = item.hp.trim().split(" ");
    await searchPage.$eval('#minPowerAsArray', (el, t) => el.value = t[3], hp);

    if (item.engine == "Automatik") {
        // searchPage.click('#transmissions-AUTOMATIC_GEAR-ds');
        await searchPage.$eval('#transmissions-AUTOMATIC_GEAR-ds', check => check.checked = true);
    }

    if (item.engine == "Manuelles Getriebe") {
        await searchPage.$eval('#transmissions-MANUAL_GEAR-ds', check => check.checked = true);
        // searchPage.click('#transmissions-MANUAL_GEAR-ds');
    }
    // await searchPage.$eval('#selectMake1-ds', el => el.value = brand[0]);
    await searchPage.waitForSelector('#dsp-upper-search-btn');
    //await searchPage.click('#dsp-upper-search-btn');
    await new Promise(function(resolve) {setTimeout(resolve, 50000)});
    let result = await searchPage.$eval("#dsp-lower-search-btn", elem => elem.getAttribute("data-results"));
    console.log("result:", result);
    if (result == "0"){
	return res.status(200).json({result: "no price"});
    }
    await searchPage.$eval("#dsp-lower-search-btn", elem => elem.click());
	await searchPage.waitForSelector('.cBox--resultListHeader', {timeout: 60000});
	let count = await searchPage.$eval(".cBox--resultListHeader", elem => elem.querySelector("h1:first-child").innerText);
	count = count.split(" ");
	if(count[0] == "0"){
		return res.status(200).json({result: "no price"});
	}
    await searchPage.waitForSelector('.price-block');
    let prices = await searchPage.$$eval('.price-block', prices => {
	// Extract the links from the data
	prices = prices.map(el => el.querySelector('span:first-child').textContent);
	return prices;
    });
    let price = prices.reduce((a, b) => parseFloat(a) + parseFloat(b), 0)/prices.length;
    price = price.toFixed(3);
	console.log("prices:", prices);
    console.log("price:", price);
    return res.status(200).json({price: price + " €"});
}
module.exports = {
    search
}