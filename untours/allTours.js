var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.untours.com/regionlist.html',
  'https://www.untours.com/venturebytype.asp?typeid=4389',
  'https://www.untours.com/venturebytype.asp?typeid=4390',
  'https://www.untours.com/venturebytype.asp?typeid=4391',
  'https://www.untours.com/venturebytype.asp?typeid=4392',
  'https://www.untours.com/venturebytype.asp?typeid=4465',
  'https://www.untours.com/nafplio/dimitri-1'
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
    $('.rltextlink').each(function(index, elem){
    var productUrl = 'https://www.untours.com' + $(elem).attr('href');
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, //keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
      // keywords = [];
      // //$('.selDiv option[value="SEL1"]')
      //  //key1 = $('.swatchinput').attr('title');
      //  $('.swatchinput').each(function () {
      //    keywords.push($(this).children().first().attr("title"));
      //  });
      // key2 = $('.color_pick').eq(1).attr('name');
      // key3 = $('.color_pick').eq(2).attr('name');
		  productName = $('.product-title.entry-title').text();
      productPrice = $('.price.product-page-price').text();
      productDescription = $('.dropcap').next().text();
      pageTitle = $('title').text();
		  imageUrl = $('.images').attr('src');

      //keywords.push(key1, key2, key3);
      // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        //'keywords: color': keywords
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
