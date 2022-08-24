describe("All test for serving and managing bills", function(){
	var server = require("../../boottest");
	var Biller = require("../../app/controllers/bills").bills;
	var data = {
		"patientName":"Ali Bomaye",
		"patientId":"3424232",
		"class":"5286469d95e9b53f15000008",
		"drugs":[{
				"_id":"5270e7a9addac98f0d000005",
				"amount":10,
				"itemName":"Forane",
				"status":"dispense",
				"dosage":"Once Daily (OD)",
				"period":10,
				"cost":6
			}],
		"location":{
			"locationId":0,
			"locationName":"Default",
			"locationAuthority":"Koded",
			"locationBoilingPoint":600,
			"locationDescription":"None",
			"_id":"5270ee12addac98f0d000007",
			"__v":0,
			"createdAt":"2013-10-30T11:31:30.321Z"
		}
	};
	var complete = false, result;
	it("should serve a bill", function(){
		runs(function(){
			Biller.serveBill(data, function(r){
				result = r;
				complete = true;
			});
		});
		waitsFor(function(){
			return complete;
		});
		runs(function(){
			expect(result).toBeDefined();
		});
	});
});