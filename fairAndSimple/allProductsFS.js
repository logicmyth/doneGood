var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.fairandsimple.com/shop/direct/',
  'https://www.fairandsimple.com/shop/direct?page=2',
  'https://www.fairandsimple.com/shop/direct?page=3',
  'https://www.fairandsimple.com/shop/direct?page=4',
  'https://www.fairandsimple.com/shop/direct?page=5',
  'https://www.fairandsimple.com/shop/direct?page=6'
]

Promise.map(urls, function(url){
	var options = {
		uri: url,
		transform: function(body){
			return cheerio.load(body);
		}
	}
	return Promise.delay(50, rp(options));
}, {concurrency: 1})
.then(function(pages){
	pageUrls = [];
	// Here is the access to the product page listings
	pages.forEach(function($){
		// This code here grabs the url from each listing, and then pushes that url into the pageUrls array
	  $('.product-box a').each(function(index, elem){
      var hs = 'https://www.fairandsimple.com'
	    var productUrl = hs + $(elem).attr("href");
	    pageUrls.push(productUrl);
	  });
	})
	return pageUrls;
})
.then(function(pageUrls){
	Promise.map(pageUrls, function(url){
		var options = {
			uri: url,
			transform: function(body){
				return [url, cheerio.load(body)];
			}
		}
		return Promise.delay(20, rp(options));
	}, {concurrency: 5})
	.then(function(responses){
		var results = {};
		// Response Array [url, cheerio body]
		responses.forEach(function(response){
			// Now here is where we have access to each individual product page to get the rest of our information
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('div.col-md-5 > h2').text();
		  productPrice = $('div.col-md-5 > h3').text();
		  productDescription = $('div.description > p').text();
		  pageTitle = $('title').text();
    	var http = 'https://fairandsimple.com';
		  imageUrl = http + $('.product-image').attr('src');

		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl
		  };
		  
		  console.log(results[productName])

		})
		return results;
	})
	.then(function(results){
		// Now write the results to a json file
    fs.writeFile('outputFS.json', JSON.stringify(results, null, 4), function(err){
      console.log('done');
    })
	})
	.catch(function(err){
		console.log(err);
	})
})
.catch(function(err){
	console.log(err);
})
