var server = require("../../boottest.js");
describe("Items Class Tests", function(){
	var Item = require("../../app/controllers/items.js").item;
	var item = new Item();
	var mongoose = require("mongoose");
	var Schema = mongoose.Schema;
	//var Item = require("../../app/models/item.js")
	var completed, result = {};
	var test_id;
	var thisItem = {
		item:{
			itemType: "Medication",
			itemName: "Monkey Semen",
			sciName: "Banana Sticky Mix",
			manufacturerName: "Baboon Nature",
			itemCategory: "Jungle",
			itemDescription: "Nothin Really",
			itemBoilingPoint:45,
			itemPackaging:"Rolls",
			itemForm: "Tablets",
			itemPurchaseRate: 900,
			packageSize: 800,
			supplierName: "Jide Blah Hane"
		}
	}	
	beforeEach(function(){
		completed = false;
		//spyOn(item, "create");
		//spyOn(item, "count");
	});

	it("should count the amount", function(){
		runs(function(){
			item.count(function(low, total){
				result.low = low;
				result.total = total;
				completed = true;
				console.log("low: %s, total: %s", low, total);
			});			
		});

		waitsFor(function(){
			return completed;
		})

		runs(function(){
			expect(result.low).toBeDefined();
			expect(result.total).toBeDefined();
			expect(typeof(result.low)).toEqual("number");
			expect(typeof(result.total)).toEqual("number");		
			//expect(item.count).toHaveBeenCalled();	
		})

	});

	it("should add a new Item", function(){
		
		runs(function(){
			item.create(thisItem, function(l){
				result.create = l;
				completed =  true;
			});
		});

		waitsFor(function(){
			return completed;
		});

		runs(function(){
			console.log(result.create);
			expect(typeof(result.create)).toEqual("object");
			expect(result.create.itemName).toEqual(thisItem.item.itemName);
			//expect(item.create).toHaveBeenCalled();
		})
	});

	xit("should add an new item and place an order for it", function(){
		thisItem.item.itemName = "Fire Balls"
		thisItem.item.orderInvoiceData = {
			orderInvoiceNumber: 587559,
			orderInvoiceAmount:	1000	
		};

		runs(function(){
			item.create(thisItem, function(l){
				result.order = l;
				completed = true;
			});
		});

		waitsFor(function(){

		});

		runs(function(){

		});

	});


	afterEach(function(){
		completed = false;

	})
});