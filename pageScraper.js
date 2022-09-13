const scraperObject = {
    url: 'https://de.bca-europe.com/buyer/facetedSearch/saleCalendar?bq=%7Csalecountry_exact:DE&currentFacet=salecountry_exact',
    async scraper(browser){
        let page = await browser.newPage();
        await page.setDefaultNavigationTimeout(0);
		console.log(`Navigating to ${this.url}...`);
		// Navigate to the selected page
		// Configure the navigation timeout
	    await page.goto(this.url, {
	        waitUntil: 'load',
	        // Remove the timeout
	        timeout: 0
	    });
		// Wait for the required DOM to be rendered
		await page.waitForSelector('.sale-title-link');
		// Get the link to all the required books
		let urls = await page.$$eval('.sale-title-link', links => {
			// Make sure the book to be scraped is in stock
			//links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
			// Extract the links from the data
			links = links.map(el => el.getAttribute("href"));
			return links;
		});


		//await page.waitForTimeout(4000)


		await page.$eval('#q', el => el.value = 'wagen');


		console.log(urls);

        //Loop through each of those links, open a new page instance and get the relevant data from them
		let pagePromise = (link) => new Promise(async(resolve, reject) => {
			let data = [];
			let newPage = await browser.newPage();
			await newPage.setDefaultNavigationTimeout(0);
			console.log(`Navigating to ${link}...`);
			// Configure the navigation timeout
		    await newPage.goto('https://de.bca-europe.com' + link, {
		        waitUntil: 'load',
		        // Remove the timeout
		        timeout: 0
		    });

			await newPage.waitForSelector('.listing');

			data = await newPage.$$eval('.listing', links => {
				// Make sure the book to be scraped is in stock
				//links = links.filter(link => link.querySelector('.instock.availability > i').textContent !== "In stock")
				// Extract the links from the data
				let data={};
				data = links.map(el => ({
					"brand": el.querySelector('.left.listing__title > a').textContent,
					"reg_date": el.querySelector('.table > ul > li:first-child > span:first-child').textContent,
					"mile": el.querySelector('.table > ul > li:first-child > span:nth-child(2)').textContent,
					"door": el.querySelector('.table > ul >li:nth-child(2) > span:nth-child(4)') ? el.querySelector('.table > ul >li:nth-child(2) > span:nth-child(2)').textContent : el.querySelector('.table > ul >li:nth-child(2) > span:first-child').textContent,
					"seat": el.querySelector('.table > ul >li:nth-child(2) > span:nth-child(4)') ? el.querySelector('.table > ul >li:nth-child(2) > span:nth-child(3)').textContent : el.querySelector('.table > ul >li:nth-child(2) > span:nth-child(2)').textContent,
					"type": el.querySelector('.table > ul >li:nth-child(2) > span:last-child').textContent,
					"engine": el.querySelector('.table > ul >li:nth-child(3) > span:first-child').textContent,
					"fuel": el.querySelector('.table > ul >li:nth-child(3) > span:nth-child(2)').textContent,
					"hp": el.querySelector('.table > ul >li:nth-child(3) > span:last-child').textContent,
				}));
				return data;
			});

			resolve(data);
			await newPage.close();
		});

		//for(link in urls){
			let currentPageData = await pagePromise(urls[0]);
			// scrapedData.push(currentPageData);
			console.log(currentPageData);

			for(var i=0;i<currentPageData.length;i++){
				var item = currentPageData[i];console.log("item:",item.brand.trim().split(" "));
				let searchPage = await browser.newPage();
				await searchPage.setDefaultNavigationTimeout(0);
				console.log(`Navigating to searchPage...`);
				await searchPage.goto('https://suchen.mobile.de/fahrzeuge/search.html?dam=0&sb=rel&vc=Car');
				var make = item.brand.trim().split(" ");

				let makeCode = await searchPage.$$eval('#selectMake1-ds > option', (links, t) => {
					// Make sure the book to be scraped is in stock
					links = links.filter(link => link.textContent == t)
					// Extract the links from the data
					links = links.map(el => el.value);
					return links;
				}, make[0]);

				console.log("code:",makeCode);
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
				let model1 = (make[1] + " " +make[2]).toUpperCase();
				let modelCode1 = await searchPage.$$eval('#selectModel1-ds > option', (links, t) => {
					// Make sure the book to be scraped is in stock
					links = links.filter(link => link.textContent.trim().toUpperCase() == t)
					// Extract the links from the data
					links = links.map(el => el.value);
					return links;
				}, model1);
				let model2 = (make[1] + " " +make[2] + " " + make[3]).toUpperCase();
				let modelCode2 = await searchPage.$$eval('#selectModel1-ds > option', (links, t) => {
					// Make sure the book to be scraped is in stock
					links = links.filter(link => link.textContent.trim().toUpperCase() == t)
					// Extract the links from the data
					links = links.map(el => el.value);
					return links;
				}, model2);
				
				if (modelCode1.length != 0){
					console.log(typeof modelCode1);
					modelCode = modelCode1;
				} else if (modelCode2.length != 0){
					modelCode = modelCode2;
				}

				console.log("code:",modelCode, modelCode1, modelCode2, model, model1, model2);
				await searchPage.select('#selectModel1-ds', modelCode[0]);

				//console.log("code:",modelCode);
				//await searchPage.select('#selectModel1-ds', modelCode[0]);
				var variant = make[make.length-3] + " " + make[make.length-2];
				await searchPage.$eval('#modelDescription1-ds', (el,t) => el.value = t, variant);
				if(item.type == " Kombi"){
					await searchPage.$eval('#categories-EstateCar-ds', check => check.checked = true);
					// searchPage.click('#categories-EstateCar-ds');
				}
				// if(item.type == " Kombi"){
				// 	page.click('#categories-EstateCar-ds');
				// }

				var year = item.reg_date.trim().split(".");
				await searchPage.$eval('#minFirstRegistrationDate', (el,t) => el.value = t[2], year);
				var seat = item.seat.trim().split(" ");
				await searchPage.$eval('#minSeats', (el,t) => el.value = t[0], seat);
				await searchPage.$eval('#maxSeats', (el,t) => el.value = t[0], seat);
				var door = item.door.trim().split(" ")[0];
				var value;
				if(door == '2' || door == '3'){
					value = "TWO_OR_THREE";
				} else if(door == '4' || door == '5'){
					value = "FOUR_OR_FIVE";
				} else if(door == '6' || door == '7'){
					value = "SIX_OR_SEVEN";
				}
				await searchPage.select('#doorCount-ds', value);
				var mile = item.mile.trim().split(" ");
				await searchPage.$eval('#minMileage', (el,t) => el.value = t[0], mile);

				if(item.fuel == " Diesel"){
					// searchPage.click('#fuels-DIESEL-ds');
					await searchPage.$eval('#fuels-DIESEL-ds', check => check.checked = true);
				}

				// if(item.fuel == " Diesel"){
				// 	// searchPage.click('#fuels-DIESEL-ds');
				// 	await searchPage.$eval('#fuels-DIESEL-ds', check => check.checked = true);
				// }
				var hp = item.hp.trim().split(" ");
				await searchPage.$eval('#minPowerAsArray', (el,t) => el.value = t[3], hp);

				if(item.engine == "Automatik"){
					// searchPage.click('#transmissions-AUTOMATIC_GEAR-ds');
					await searchPage.$eval('#transmissions-AUTOMATIC_GEAR-ds', check => check.checked = true);	
				}

				if(item.engine == "Manuelles Getriebe"){
					await searchPage.$eval('#transmissions-MANUAL_GEAR-ds', check => check.checked = true);
					// searchPage.click('#transmissions-MANUAL_GEAR-ds');
				}
				// await searchPage.$eval('#selectMake1-ds', el => el.value = brand[0]);

				searchPage.click('#dsp-upper-search-btn');
			}
		//}

    }
}

module.exports = scraperObject;