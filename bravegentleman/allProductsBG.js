var fs = require('fs');
var cheerio = require('cheerio');
var rp = require('request-promise');
var Promise = require('bluebird');


/*
* This is a two step scraping method. First identify all the pages on a website that list products. Put all of those links into the URL array below
*/
urls = [
  'https://www.bravegentleman.com/index.php/pants.html',
  'https://www.bravegentleman.com/index.php/tops.html',
  'https://www.bravegentleman.com/index.php/shoes.html',
  'https://www.bravegentleman.com/index.php/bgmroot.html',
  'https://www.bravegentleman.com/index.php/accessories.html',
  'https://www.bravegentleman.com/index.php/suits.html'
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
    $('.product-image').each(function(index, elem){
      var productUrl = $(elem).attr("href");
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
		  var productUrl, productPrice, imageUrl, pageTitle, productDescription, productName, keywords

		  productUrl = response[0];
		  $ = response[1];

		  // This is where the specific queries are written to get all the info you need
		  // Can even get all the meta data, google how to get a pages meta data from Jquery
		  productName = $('.product-name').text();
		  productPrice = $('.regular-price').text();
		  productDescription = $('.std').text();
		  pageTitle = $('title').text();
		  imageUrl = $('#image').attr('src');
      keywords = $('meta[name=keywords]').attr("content").split(" ");
      //keywords = $('em').text();
      //var keywordsArr = keywords.split("•").pop();
		  // Store all the info we found into the results array
		  results[productName] = {
		    'productName': productName,
		    'productPrice': productPrice,
		    'productDescription': productDescription,
		    'productUrl': productUrl,
		    'pageTitle': pageTitle,
		    'imageUrl': imageUrl,
        'keywords': keywords

// colorData : [
// colorname1 : {
// name: string,
// url : string,
// imageURL : string},
// colorname2 : {
// name: string,
// url : string,
// imageURL : string},
// ...
//
// }
// ]
		  };

		})
		return results;
	})
//   .then(function(results){
//     return rp({
//    // uri = the url we want it to request
//    uri: 'https://bravegentleman.com',
//    // transform = do some extra stuff once you process that request
//    transform: function(body){
//      // body = the html from the metaUrl
//      // We still need the results for the next then
//      return [results, cheerio.load(body)] //array
//    }
//  })
// })
// .then(function(responses){
//   //console.log(responses);
//   var results = responses[0];
//   var $ = responses[1];
//   var keywords = $('meta[name=keywords]').attr("content")
//   results[keywords];
//   return fileResults
// })
  .then(function(results){
		// Now write the results to a json file
    // var metaResults = fileResults[0];
    // var dataResults = fileResults[1];
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
