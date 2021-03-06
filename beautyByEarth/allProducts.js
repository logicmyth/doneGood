var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.beautybyearth.com/product-category/face/',
  'https://www.beautybyearth.com/product-category/face/page/2/',
  'https://www.beautybyearth.com/product-category/lips/',
  'https://www.beautybyearth.com/product-category/body/',
  'https://www.beautybyearth.com/product-category/hair-care/',
  'https://www.beautybyearth.com/product-category/sun-care/',
  'https://www.beautybyearth.com/product-category/bundles-kits/'

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
	  $('.cg-product-img').each(function(index, elem){
	    var productUrl = $(elem).children().first().attr("href");
      //console.log(productUrl);
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName//, keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product_title.entry-title').text();
      //$('p.price > span').text();
      productDescription = $('.woocommerce-product-details__short-description').text()
      priceString = $('.woocommerce-Price-amount.amount').text();
      priceArray = priceString.split("$");
      productPrice = priceArray[2];
      pageTitle = $('title').text();
		  imageUrl = $('.woocommerce-product-gallery__image').children().first().attr("href");

      //keywords.push(key1,key2,key3,key4,key5);
      // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl
        //'keywords': keywords
		  };

		})
		return results;
	})
	.then(function(results){
		// Now write the results to a json file
    fs.writeFile('output.json', JSON.stringify(results, null, 4), function(err){
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
