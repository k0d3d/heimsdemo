/**
 * Language Constants
 */
angular.module('language', [])

.constant('Language', {
	"set":"eng",
	"eng":{
		"items": {
			"location":{
				"history":{
					"fetch":{
						"error": "Error loading item stock history"
					}
				}
			},
			"save": {
				"success":"You've succesfully added an item. To add another item, close this dialog or return to the dashboard",
				"error": "Something went wrong while carrying out your last request. If it's nothing serious, you can try again. If this error happens again, please inform the Admin",
				"success-alt" : "You've succesfully added an item. Note: Items placed with invoice numbers and stock amounts will have their current stock updated. To add another item, close this dialog or return to the dashboard"
			},
			"autocomplete":{
				"brandname":"",
				"suppliers":""
			},
			"category":{
				"add":{
					"success":"Category list updated",
					"error": "Error creating an item category"
				},
				"list":{
					"error": "Error Fetching Categories"
				},
				"delete":{
					"success":"Category Deleted",
					"error":"Error! Deleting category failed"
				}
			},
			"list":{
				"fetch":{
					"success": "Fetched list of items successfully",
					"error": 'Failed to fetch list of items from the server. Will try again'
				}
			},
			"form": {
				"add":{
					"success": "Item form list updated",
					"error": "Error updating item form list"
				},
				"list":{
					"error":"Error fetching item forms"
				}
			},
			"packaging":{
				"add":{
					"success":"Packaging list updated",
					"error": "Error updating packaging list"
				},
				"list":{
					"error": "Error fetching packaging list"
				}
			},
			"supplier":{
				"typeahead":{
					"error":"Failed to fetch list of suppliers"
				}
			},
			"update": {
				"success": "Item updated successfully",
				"error" : "Failed to update this item"
			}
		},
		"supplier": {
			"add": {
				"success":"You have added a new supplier",
				"error": "An error occured with the last request"
			},
			"update":{
				"success": "You have updated this supplier entry",
				"error": "An error occured with this updated, please try again"
			}
		},
		"order":{
			"update":{
				"success": "This order has been updated",
				"error": "Order update failed",
				"amountDis": "The amount supplied is lesser than the amount ordered for. Do you want to place another order? <a href=\"\/dashboard\/order\">Yes<\/a >"
			},
			"place":{
				"success": "You've succesfull placed an order.",
				"error":"Failed to place a new order. An error occured. Please try again"
			},
			"search":{
				"error": "Error searching through drug register",
				"notfound": "Drug not found"
			},
			"summary":{
				"error": "Can not fetch more information now."
			},
			'cart' : {
				'success' : 'Item Added to Cart',
				'error' : 'Failed to add item to cart'
			}

		},
		"dispense":{
			"confirm":{
				"amount": {
					"error": "Please check the amount requested is in stock"
				}
			},
			"approve" : {
				"success": "Sent prescription successfully",
				"error" : "Error prescribing items for this patient",
				"fail": "You have not confirmed any items. Check your list"
			},
			"addDrug":{
				"error": "This item is already in the list"
			},
			"bills":{
				"view":{
					"success":"",
					"error": "Error viewing this bill"
				},
				"pay":{
					"success": "Bill payment recorded",
					"error": "Error recording bill payment"
				}
			},
			"prescribe":{
				"error": "Error processing prescription request, Please try again"
			}
		},
		"bills":{
			"rule":{
				"add":{
					"success": "New billing rule successfully added",
					"error": "Error saving a new billing rule"
				},
				"fetch":{
					"error": "Could not fetch the list of rules"
				}
			},
			"profiles":{
				"create":{
					"success": "Created a new billing profile successfully",
					"error": "Error trying to create a new billing profile"
				},
				"save" : {
					"success": "Updated billing profile",
					"error": "Error updating billing profile"
				},
				"fetch": {
					"error": "I can't fetch the list of saved profiles"
				}
			}
		},
		"stock":{
			"down":{
				"success": "Stock down request sent",
				"error": "Error requesting stock down"
			},
			"location":{
				"create": {
					"success": "Created a new stock down loaction",
					"error": "Could not create a new stock down location"
				},
				"edit":{
					"success": "Update request completed",
					"error": "Update request failed"
				}
			},
			"items":{
				"boilingPoint":{
					"success":"Item Boiling Point updated",
					"error": "Error updating item boiling point"
				}
			}
		},
		"admin":{
			"update":{
				"success" :  "Update successful",
				"error": "Error fetching updates from server"
			},
			"clear":{
				"error":"Last request failed. Try again : Clear updates"
			},
			"auth":{
				"success": "You are now logged in",
				"error": "Error login into Integra Online."
			},
			"services":{
				"addService": {
					"success":"Successfully saved a new facility service"
				},
				"allService":{
					"success": "Loaded all facility services"
				},
				"removeService":{
					"success": "Removed facility service from the list"
				}
			}
		}
	}
});