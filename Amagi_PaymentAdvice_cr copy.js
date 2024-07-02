/*
    Script Name		:	Amagi_PaymentAdvice.js
    Author			:   Sagar kumar
    Company			:   Ambit Software Pvt. Ltd. - PUNE
    Date			:   2023/21/09
    Version			:	2.x
    Description		:   To send payment advice attachment on included ids. 
*/

// Enter Criteria 
function PaymentAdviceCriteria(request, response)
{
	if ( request.getMethod() == 'GET' )	{
		// Get Criteria
		var form = nlapiCreateForm('Bill Payment Advice'); // Create criteria form
		form.setScript('customscript_amagi_cli_paymentadviceval');
		// Add fields to form
		var StartDate = form.addField('custpage_startdate','date', 'Start Date').setMandatory(true); // Start Date
		var EndDate = form.addField('custpage_enddate','date', 'End Date').setMandatory(true); // End Date	
		form.addSubmitButton('Start Process'); // Add submit Button
		response.writePage( form );
	}
	else {
		var userId = nlapiGetUser();

		var startDate = request.getParameter('custpage_startdate'); // Get Start Date
		var endDate = request.getParameter('custpage_enddate'); // Get End Date
		nlapiLogExecution('DEBUG',' GenerateReport : ',' startDate : '+ startDate);
		nlapiLogExecution('DEBUG',' GenerateReport : ',' endDate : '+ endDate);
		var params = new Array();
		params['custscript_adv_start_date'] = startDate;
		params['custscript_adv_end_date'] = endDate;
		params['custscript_userid'] =	userId;
		params['custscript_totalresult'] =	0;
		nlapiScheduleScript('customscript_amagi_sch_paymentadvice','customdeploy_amagi_sch_paymentadvice',params);  
		// nlapiSetRedirectURL('TASKLINK', 'LIST_SCRIPTSTATUS'); // Redirect to script execution status
		nlapiSetRedirectURL('SUITELET','customscript_amg_show_adv_pmnt_process', 'customdeploy_amg_show_adv_pmnt_process', false, params);
	}
}

function getBillPaymentInfo(startDate,endDate)
{
	var vpResultArr = new Array();

	try {
		var vendorpaymentSearch = nlapiSearchRecord("vendorpayment",null,
			[
			["custbody_payment_advice_flag","is","F"], 
			"AND", 
			["type","anyof","VendPymt"], 
			"AND", 
			["mainline","is","T"], 
			"AND", 
			["trandate","within",startDate,endDate],
			"AND",
          	["custbody_amg_pymt_adv_error", "isempty", ""],
			], 
			[
			new nlobjSearchColumn("type"),  
			new nlobjSearchColumn("internalid")
			]
			);

            if(_logValidation(vendorpaymentSearch))
			if(vendorpaymentSearch.length > 0){
				for (var vdrIndex = 0; vdrIndex < vendorpaymentSearch.length; vdrIndex++) {
					var vdrResult = vendorpaymentSearch[vdrIndex];
					var vdrPmntType = vdrResult.getValue("type");
					var pmntType = vdrPmntType == "VendPymt" ? "Payment": "Payment";

					vpResultArr.push({
						type: pmntType,
						id: vdrResult.getValue("internalid")
					});
					
				}
			}
	} // try End
	catch(ex) {
		nlapiLogExecution("DEBUG","Exception",ex);
		throw ex.message;
	}
	
	return vpResultArr;
}

function getJournalEntryInfo(startDate,endDate)
{
	var jvResultArr = new Array();
	
	try {
		var journalentrySearch = nlapiSearchRecord("journalentry",null,
		[
		["custbody_payment_advice_flag","is","F"], 
		"AND", 
		["type","anyof","Journal"], 
		"AND", 
		["trandate","within",startDate,endDate], 
		"AND", 
		["line","equalto","1"],
		"AND",
        ["custbody_amg_pymt_adv_error", "isempty", ""],
		],
		[
		new nlobjSearchColumn("type"), 
		new nlobjSearchColumn("internalid")
		]
		);

        if(_logValidation(journalentrySearch))
		if(journalentrySearch.length>0){
			for (var jrnIndex = 0; jrnIndex < journalentrySearch.length; jrnIndex++) {
				var jeResult = journalentrySearch[jrnIndex];

				jvResultArr.push({
					type: jeResult.getValue("type"),
					id: jeResult.getValue("internalid")
				});
				
			}
		}
	} // try End
	catch(ex) {
		nlapiLogExecution("DEBUG","Exception",ex);
		throw ex.message;
	}

	return jvResultArr;
}

function sortFunction(a, b) 
{
	if (a["trandate_sort"] === b["trandate_sort"])
		return 0;
	else
		return (a["trandate_sort"] < b["trandate_sort"]) ? -1 : 1;
}	

// First Suitlet client script validation
function validation1()
{
    debugger;
	var startDate = nlapiGetFieldValue('custpage_startdate');
	var endDate = nlapiGetFieldValue('custpage_enddate');
	startDate = nlapiStringToDate(startDate);
	endDate = nlapiStringToDate(endDate);
    var isDays = findDaysofDate(startDate, endDate);

	nlapiLogExecution('DEBUG', 'isdays', isDays);
    console.log('isdays', isDays);
	
	if(startDate > endDate){
        alert('Start date shoud not be greater than End date.');
    }
	else if(isDays > 7){
        alert("Days difference Can't be more than 7 days.");
    }		
	else{
        return true;
    }
		
}

function findDaysofDate(startDate, endDate){
	// Define two date objects
var date1 = new Date(startDate);
var date2 = new Date(endDate);

// Calculate the time difference in milliseconds
var timeDifference = Math.abs(date1 - date2);

// Calculate the number of days by dividing milliseconds by milliseconds per day
var daysDifference = Math.ceil(timeDifference / (1000 * 3600 * 24));

console.log('The number of days between the two dates is: ' + daysDifference + ' days');

return daysDifference;

}

// Second Suitlet client script validation
function validation()
{
	var idsArr = "";
	var lineNum = nlapiGetLineItemCount('custpage_billpaymentlist');
	for(var i = 1; i <= lineNum; i++) {
		var check = nlapiGetLineItemValue('custpage_billpaymentlist', 'custpage_select', i);		
		if(check == 'T') {
			var internalId = nlapiGetLineItemValue('custpage_billpaymentlist', 'custpage_id', i);
			if(_logValidation(internalId))
				idsArr += internalId + ',';
		}
	}	
	if(idsArr == "")
		alert('Please select bill payment first.');
	else
		return true;
}

function loadRecords() {
	// checkUnitConsumption();
	var contextObj = nlapiGetContext(); // Get Context
	var userId = contextObj.getSetting('SCRIPT', 'custscript_userid');
	var startDate = contextObj.getSetting('SCRIPT', 'custscript_adv_start_date'); // Get All Account Ids
	var endDate = contextObj.getSetting('SCRIPT', 'custscript_adv_end_date'); // Get User Id
	nlapiLogExecution('DEBUG',' loadRecords : ',' startDate : '+ startDate + ' endDate : '+ endDate);
	var billPaymentResult = getBillPaymentInfo(startDate,endDate);
	// nlapiLogExecution('DEBUG',' loadRecords : ',' billPaymentResult : '+ JSON.stringify(billPaymentResult));

	var journalEntryResult = getJournalEntryInfo(startDate,endDate);
	// nlapiLogExecution('DEBUG',' loadRecords : ',' journalEntryResult : '+ JSON.stringify(journalEntryResult));
	var resultArr = "";
	if(_logValidation(billPaymentResult)) {
		if(_logValidation(journalEntryResult)){
			resultArr = billPaymentResult.concat(journalEntryResult);
		}else{
			resultArr = billPaymentResult;
		}
	}else{
		if(_logValidation(journalEntryResult)){
			resultArr = journalEntryResult;
		}
	}

	// nlapiLogExecution('DEBUG',' loadRecords : ',' resultArr : '+ JSON.stringify(resultArr));

	if(_logValidation(resultArr))
	sendEmail(resultArr,userId);
	// checkUnitConsumption();
}

function sendEmail(recordArr,userId)
{
	var errRecordObj = {};
	try {
		var context = nlapiGetContext();
		for (var arrIndex = 0; arrIndex < recordArr.length; arrIndex++) {
			// var unitsUsed = context.getUsage();
			nlapiLogExecution('DEBUG', 'Unit Consumption in starting index no '+arrIndex, 'Units Used: ' + context.getRemainingUsage());

			var record = recordArr[arrIndex];
			errRecordObj = recordArr[arrIndex];
			var paymentRecordType = record.type;
			// nlapiLogExecution('DEBUG','paymentRecordType : ',paymentRecordType);

			var billPaymentData = "";
			if(paymentRecordType == "Payment"){
				// nlapiLogExecution('DEBUG','record.id : ',record.id);
				billPaymentData = searchBillPaymentRecord(record.id);
			}
			else{
				// nlapiLogExecution('DEBUG','record.id : ',record.id);
				billPaymentData = searchJournalRecord(record.id);
			}
			
			nlapiLogExecution('DEBUG',' sendEmail : ',' billPaymentData : '+ JSON.stringify(billPaymentData));
			// var billPaymentDataFile = nlapiCreateFile("billPaymentData.txt", 'PLAINTEXT', JSON.stringify(billPaymentData));
			
			if(_logValidation(billPaymentData)) {
				var vendorBank = billPaymentData[billPaymentData.length - 1].vendor_bank
                nlapiLogExecution('DEBUG',' vendorBank', vendorBank);
				var vendorBankAcc = billPaymentData[billPaymentData.length - 1].vendor_bank_acc
                
				//Added by Pavan 15-09-22
				  if (vendorBankAcc) {
                    var count = vendorBankAcc.length - 6
                    var mask = ""
                    for (var i = 0; i < count; i++) {
                        mask += "*"
                    }

                    var m1 = vendorBankAcc.substring(0, 2)
                    var m2 = vendorBankAcc.substring(vendorBankAcc.length - 4, vendorBankAcc.length)
                    //console.log(m2)
                    vendorBankAcc = m1 + mask + m2
                }
                nlapiLogExecution('DEBUG', 'VendorBankACC', vendorBankAcc)
				//End
				var currencyFormat = billPaymentData[billPaymentData.length - 1].currency;
				var inrValue = "";
				if(currencyFormat == "Rs")
					inrValue = "Rupees";
				else
					inrValue = currencyFormat;
				
				var vendorEmailArray = new Array();
				//var emailId = "ramdas.darade@ambitsoftware.com";
				//var emailId = "yogesh.shinde@ambitsoftware.com";
				var emailId = billPaymentData[0].vendor_email;
				if(_logValidation(emailId))
				vendorEmailArray.push(emailId);
				var emailId1 = billPaymentData[0].vendor_email_a;
				if(_logValidation(emailId1))
					vendorEmailArray.push(emailId1);
				var emailId2 = billPaymentData[0].vendor_email_b;
				if(_logValidation(emailId2))
					vendorEmailArray.push(emailId2);
				var emailId3 = billPaymentData[0].vendor_email_c;
				if(_logValidation(emailId3))
					vendorEmailArray.push(emailId3);
				
				var result = "";
				if(paymentRecordType == "Payment")
					result =  createPaymentAdvice(billPaymentData,paymentRecordType);
				else
					result =  createPaymentAdvice(billPaymentData,paymentRecordType);
				
				var amt = result.amount;
				var amtInWords = result.amount_in_words;
				if(inrValue != "Rupees")
					amtInWords = amtInWords ? amtInWords.replace("Paise", "") : "";
				
				var strMessage = 'Dear Sir/Madam,' + '\n\n' + 'We have effected a payment to a/c no. '+vendorBankAcc+ ' with  '+vendorBank+' for '+currencyFormat+ '. '+amt+'(' +inrValue+ ' ' +amtInWords+').\n';
					strMessage += '\n' + 'Please find attached payment advice for details.';
					strMessage += '\n\n\n' + 'Thank you,' + '\n' + 'Amagi Media Labs Private Ltd' + '\n' + 'Finance Team.';	

				var Email_Subject = " NetSuite E-Mail Notification : " + "About Payment Advice...";
				var EmailBody = strMessage;
				nlapiLogExecution('DEBUG',' sendEmail : ',' vendorEmailArray : '+ vendorEmailArray);
				if(_logValidation(vendorEmailArray)){
                  try{
					nlapiSendEmail(userId, vendorEmailArray, Email_Subject, EmailBody, null, null, null, result.attachment);
                  }catch(e1){nlapiLogExecution('ERROR',' sendEmail : ', e1.message);}
                }else {
					nlapiLogExecution('ERROR',' sendEmail : ','Invalid Email address or Email adrress not found.');
					//throw "Email adrress not found.";
				}
				if(paymentRecordType == "Payment")
					nlapiSubmitField('vendorpayment', billPaymentData[billPaymentData.length - 1].bill_id, 'custbody_payment_advice_flag', 'T', true); 

				else
					nlapiSubmitField('journalentry', billPaymentData[billPaymentData.length - 1].bill_id, 'custbody_payment_advice_flag', 'T', true); 
			}else{
				if(paymentRecordType == "Payment"){
					nlapiSubmitField('vendorpayment', record.id, 'custbody_amg_pymt_adv_error', "This payment has some issue.", true);
				}
				else{
				nlapiSubmitField('journalentry', record.id, 'custbody_amg_pymt_adv_error', 'Vendor data not found in journal Entry.', true);
				}
			}

			// var unitsUsed = context.getUsage();
			nlapiLogExecution('DEBUG', 'Unit Consumption in the end index no '+arrIndex, 'Units Used: ' + context.getRemainingUsage());
		}
	}
	catch(ex) {
		nlapiLogExecution('Error', 'Something went wrong', JSON.stringify(ex));
		if(errRecordObj.type == "Payment"){
			nlapiSubmitField('vendorpayment', errRecordObj.id, 'custbody_amg_pymt_adv_error', "This payment has some issue.", true);
		}
		else{
		nlapiSubmitField('journalentry', errRecordObj.id, 'custbody_amg_pymt_adv_error', 'Vendor data not found in journal Entry.', true);
		}
		throw ex.message;
	}
}

function searchBillPaymentRecord(id)
{
	var billPaymentArray = new Array();
	if(_logValidation(id)) {		
		var srchFilter = new Array();
		var srhColumn = new Array();
		srchFilter[0] = new nlobjSearchFilter('internalid', null,'is',id);
		//srchFilter[1] = new nlobjSearchFilter('mainline', null,'is','T');
		srhColumn[0] = new nlobjSearchColumn('internalid');
		srhColumn[1] = new nlobjSearchColumn('email','vendor'); // Vendor Email
		srhColumn[2] = new nlobjSearchColumn('entity'); // Vendor Name
		srhColumn[3] = new nlobjSearchColumn('trandate'); // Transaction Date	
		srhColumn[4] = new nlobjSearchColumn('tranid'); // Transaction Date	
		
		try {
			var srchBillPayments = JSON.parse(JSON.stringify(nlapiSearchRecord('vendorpayment','customsearch_payment_advice_data',srchFilter,srhColumn)));
			nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' results : '+ JSON.stringify(srchBillPayments));
			// var srchBillPaymentsFile = nlapiCreateFile("srchBillPayments.txt", 'PLAINTEXT', JSON.stringify(srchBillPayments));
			// srchBillPaymentsFile.setEncoding('UTF-8'); 
			// srchBillPaymentsFile.setFolder('-4');
			// var srchBillPaymentsFileId = nlapiSubmitFile(srchBillPaymentsFile);
			// nlapiLogExecution('DEBUG',' searchBillPaymentRecord : ',' srchBillPaymentsFileId : '+ srchBillPaymentsFileId);
			var accName = "";
			var appliedArr = [];
			for(var b in srchBillPayments) {
              	var recInternalId = srchBillPayments[b].columns.entity.internalid;
				nlapiLogExecution('DEBUG',' searchBillPaymentRecord : ',' recInternalId :'+recInternalId);
							
				var filter = new Array();
				var columns = new Array();
				filter[0] = new nlobjSearchFilter('internalid',null,'is',recInternalId);
				columns[0] = new nlobjSearchColumn('email');
				columns[1] = new nlobjSearchColumn('custentity_emailid_a');
				columns[2] = new nlobjSearchColumn('custentity_emailid_b');
				columns[3] = new nlobjSearchColumn('custentity_emailid_c');
				columns[4] = new nlobjSearchColumn('billaddress');					
				
              	var isEmpPayee = false;
				var srchEmployee = JSON.parse(JSON.stringify(nlapiSearchRecord('employee',null,filter,columns)));
				nlapiLogExecution('DEBUG',' searchBillPaymentRecord : ',' srchEmployee : '+ JSON.stringify(srchEmployee));
				if(_logValidation(srchEmployee)) {
                  	if(_logValidation(srchEmployee[0].columns.email)){
                      	isEmpPayee = true;
                    }
                }
				if(_logValidation(srchBillPayments[b].columns.payingtransaction)) {
					var paymentType = srchBillPayments[b].columns.payingtransaction.name;
					var paymentTypeSrch = paymentType.search('Credit');
					if(paymentTypeSrch == -1) {
						// 2/06/2017
						var appliedTranId = srchBillPayments[b].columns.appliedtotransaction.internalid;
						var v = appliedArr.indexOf(appliedTranId);
						var creditAppliedTransType = paymentType.search('Journal');
						
						if(v == -1 && creditAppliedTransType == -1) {
							if(srchBillPayments[b].columns.currency.name == "Indian Rupees" ) {												
								var billJSON = {};
								billJSON['bill_id'] = srchBillPayments[b].id; // Bill Payment internal id
								
								billJSON['currency'] = srchBillPayments[b].columns.currency.name; // Currency
								
								if(_logValidation(srchBillPayments[b].columns.email))	
									billJSON['vendor_email'] = srchBillPayments[b].columns.email;	// Vendor email id
								else
									billJSON['vendor_email'] = isEmpPayee ? srchEmployee[0].columns.email : "";
								
								if(_logValidation(srchBillPayments[b].columns.custentity_emailid_a))	
									billJSON['vendor_email_a'] = srchBillPayments[b].columns.custentity_emailid_a;	// Vendor email id
								else
									billJSON['vendor_email_a'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_a : "";
								
								if(_logValidation(srchBillPayments[b].columns.custentity_emailid_b))	
									billJSON['vendor_email_b'] = srchBillPayments[b].columns.custentity_emailid_b;	// Vendor email id
								else
									billJSON['vendor_email_b'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_b : "";
								
								if(_logValidation(srchBillPayments[b].columns.custentity_emailid_c))	
									billJSON['vendor_email_c'] = srchBillPayments[b].columns.custentity_emailid_c;	// Vendor email id
								else
									billJSON['vendor_email_c'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_c : "";
								
								var vendorName = "";
								if(_logValidation(srchBillPayments[b].columns.entity)) {	// Vendor Name 
									billJSON['vendor_name'] = srchBillPayments[b].columns.entity.name;
									vendorName = srchBillPayments[b].columns.entity.name;
								}
								else
									billJSON['vendor_name'] = "";
								
								if(_logValidation(srchBillPayments[b].columns.billaddress))	{ // Vendor Address 
									var billAddress = billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
									billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
									billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
									//billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
									billJSON['vendor_bill_addr'] = billAddress;	
								}
								else
									billJSON['vendor_bill_addr'] = isEmpPayee ? srchEmployee[0].columns.billaddress : "";
								
								if(_logValidation(srchBillPayments[b].columns.trandate)) // Transaction Date
									billJSON['trandate'] = srchBillPayments[b].columns.trandate;	
								else
									billJSON['trandate'] = "";	
								
								if(_logValidation(srchBillPayments[b].columns.amount))	
									billJSON['amount'] = srchBillPayments[b].columns.amount;	// Amount
								else
									billJSON['amount'] = "";	
								
								if(_logValidation(srchBillPayments[b].columns.tranid)) {	
									billJSON['tranid'] = srchBillPayments[b].columns.tranid;	// Tran ID
									billJSON['payment_mode'] = "Cheque"; 
									billJSON['instrument_details'] = srchBillPayments[b].columns.tranid;
								}
								else {
									billJSON['tranid'] = "";
									billJSON['payment_mode'] = "Online";
									billJSON['instrument_details'] = "";
								}
								var appliedTransId = "";
								if(_logValidation(srchBillPayments[b].columns.appliedtotransaction)) {
									billJSON['apply_name'] = srchBillPayments[b].columns.appliedtotransaction.name;	// Applied Transaction
									appliedTransId = srchBillPayments[b].columns.appliedtotransaction.internalid;	
									billJSON['apply_id'] = appliedTransId;
								}	
								else {
									billJSON['apply_name'] = "";
									billJSON['apply_id'] = "";
								}			
								
								if(_logValidation(srchBillPayments[b].columns.custentity_supplierbank))	 // Vendor Bank
									billJSON['vendor_bank'] = srchBillPayments[b].columns.custentity_supplierbank;	
								else
									billJSON['vendor_bank'] = "";
								
								if(_logValidation(srchBillPayments[b].columns.custentity_beneficiaryacno))	 // Vendor Bank Acc
									billJSON['vendor_bank_acc'] = srchBillPayments[b].columns.custentity_beneficiaryacno;	
								else
									billJSON['vendor_bank_acc'] = "";
								
								if(_logValidation(srchBillPayments[b].columns.duedate))	 // Applied Transaction duedate
									billJSON['duedate'] = srchBillPayments[b].columns.duedate;	
								else
									billJSON['duedate'] = "";
								
								if(_logValidation(srchBillPayments[b].columns.account))	// Account
								{	//billJSON['account'] = srchBillPayments[b].columns.account.name;	
									billJSON['account'] = accName;	
									nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' accName : '+ accName);
								}
								else
									billJSON['account'] = "";

								if(_logValidation(srchBillPayments[b].columns.transactionnumber))	// Transaction Number
									billJSON['transactionnumber'] = srchBillPayments[b].columns.transactionnumber;	
								else
									billJSON['transactionnumber'] = "";
								
								var NetAmount = 0;
								var GrossAmount = 0;
								
								if(_logValidation(srchBillPayments[b].columns.payingamount)) {	
									billJSON['net_amount'] = srchBillPayments[b].columns.payingamount;	// Payment
									NetAmount = Number(srchBillPayments[b].columns.payingamount);
								}
								else
									billJSON['net_amount'] = "";
								
								if(_logValidation(srchBillPayments[b].columns.grossamount))	{ // Total Amount
									billJSON['grossamount'] = srchBillPayments[b].columns.grossamount;	
									GrossAmount = Number(srchBillPayments[b].columns.grossamount);
								}
								else
									billJSON['grossamount'] = "";
								
								//billJSON['credit_note'] = (Math.abs(GrossAmount) - NetAmount); // Credit Note
								
								var appliedTransType = "";
								if(_logValidation(srchBillPayments[b].columns.type)) {	
									billJSON['apply_type'] = srchBillPayments[b].columns.type.name;	// Applied transaction type
									appliedTransType = srchBillPayments[b].columns.type.internalid;	
									billJSON['apply_type_id'] = appliedTransType;
								}
								else {
									billJSON['apply_type'] = "";
									billJSON['apply_type_id'] = "";
								}
								var tdsAmount = 0.00;
								if(_logValidation(appliedTransId) && _logValidation(appliedTransType)) { // Calculate TDS
									if(appliedTransType == "VendBill") {
										var recordType = 'vendorbill';
										var recordId = appliedTransId;
										var result = calculate_VendBill_TDS(recordType,recordId);
										result = result.split('#');
										billJSON['total_tds'] = result[1];
										tdsAmount = result[1];
										billJSON['tran_date'] = result[0];
										billJSON['ref_no'] = result[3];
										// if(_logValidation(srchBillPayments[b].columns.custbody_transreferenceno))	
											// billJSON['ref_no'] = srchBillPayments[b].columns.custbody_transreferenceno;	// Custom Transaction Ref No
										// else
											// billJSON['ref_no'] = "";	
										
										//billJSON['currency'] = result[2];
									}
									else if(appliedTransType == "Journal"){
										var recordType = 'journalentry';
										var recordId = appliedTransId;
										var jvRecord = nlapiLoadRecord(recordType,recordId);
										billJSON['total_tds'] = 0.00;
										billJSON['tran_date'] = jvRecord.getFieldValue('trandate');
										billJSON['ref_no'] = jvRecord.getFieldValue('tranid');
										//billJSON['currency'] = jvRecord.getFieldValue('currency'); 
									}
								}
								else {
									billJSON['total_tds'] = 0.00;
									billJSON['tran_date'] = "";
									//billJSON['currency'] = "";
								}
								billJSON['credit_note'] = (Math.abs(GrossAmount) - NetAmount - tdsAmount); // Credit Note
								billPaymentArray.push(billJSON);
								//accName = "";
							}
							else {
								paymentTypeSrch = paymentType.search('Currency');
								if(paymentTypeSrch == -1) {
									var billJSON = {};
									billJSON['bill_id'] = srchBillPayments[b].id; // Bill Payment internal id
									
									billJSON['currency'] = srchBillPayments[b].columns.currency.name; // Currency
									
									if(_logValidation(srchBillPayments[b].columns.email))	
										billJSON['vendor_email'] = srchBillPayments[b].columns.email;	// Vendor email id
									else
										billJSON['vendor_email'] = isEmpPayee ? srchEmployee[0].columns.email : "";
									
									if(_logValidation(srchBillPayments[b].columns.custentity_emailid_a))	
										billJSON['vendor_email_a'] = srchBillPayments[b].columns.custentity_emailid_a;	// Vendor email id
									else
										billJSON['vendor_email_a'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_a : "";
									
									if(_logValidation(srchBillPayments[b].columns.custentity_emailid_b))	
										billJSON['vendor_email_b'] = srchBillPayments[b].columns.custentity_emailid_b;	// Vendor email id
									else
										billJSON['vendor_email_b'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_b : "";
									
									if(_logValidation(srchBillPayments[b].columns.custentity_emailid_c))	
										billJSON['vendor_email_c'] = srchBillPayments[b].columns.custentity_emailid_c;	// Vendor email id
									else
										billJSON['vendor_email_c'] = isEmpPayee ? srchEmployee[0].columns.custentity_emailid_c : "";
									
									var vendorName = "";
									if(_logValidation(srchBillPayments[b].columns.entity)) {	// Vendor Name 
										billJSON['vendor_name'] = srchBillPayments[b].columns.entity.name;
										vendorName = srchBillPayments[b].columns.entity.name;
									}
									else
										billJSON['vendor_name'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.billaddress))	{ // Vendor Address 
										var billAddress = billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
										billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
										billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
										//billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
										billJSON['vendor_bill_addr'] = billAddress;	
									}
									else
										billJSON['vendor_bill_addr'] = isEmpPayee ? srchEmployee[0].columns.billaddress : "";
									
									if(_logValidation(srchBillPayments[b].columns.trandate)) // Transaction Date
										billJSON['trandate'] = srchBillPayments[b].columns.trandate;	
									else
										billJSON['trandate'] = "";	
									
									if(_logValidation(srchBillPayments[b].columns.amount))	
										billJSON['amount'] = srchBillPayments[b].columns.amount;	// Amount
									else
										billJSON['amount'] = "";	
									
									if(_logValidation(srchBillPayments[b].columns.tranid)) {	
										billJSON['tranid'] = srchBillPayments[b].columns.tranid;	// Tran ID
										billJSON['payment_mode'] = "Cheque"; 
										billJSON['instrument_details'] = srchBillPayments[b].columns.tranid;
									}
									else {
										billJSON['tranid'] = "";
										billJSON['payment_mode'] = "Online";
										billJSON['instrument_details'] = "";
									}
									var appliedTransId = "";
									if(_logValidation(srchBillPayments[b].columns.appliedtotransaction)) {
										billJSON['apply_name'] = srchBillPayments[b].columns.appliedtotransaction.name;	// Applied Transaction
										appliedTransId = srchBillPayments[b].columns.appliedtotransaction.internalid;	
										billJSON['apply_id'] = appliedTransId;
									}	
									else {
										billJSON['apply_name'] = "";
										billJSON['apply_id'] = "";
									}			
									
									// if(_logValidation(srchBillPayments[b].columns.billaddress))	 // Vendor Bank
										// billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
									// else
										// billJSON['vendor_bill_addr'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.custentity_supplierbank))	 // Vendor Bank
										billJSON['vendor_bank'] = srchBillPayments[b].columns.custentity_supplierbank;	
									else
										billJSON['vendor_bank'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.custentity_beneficiaryacno))	 // Vendor Bank Acc
										billJSON['vendor_bank_acc'] = srchBillPayments[b].columns.custentity_beneficiaryacno;	
									else
										billJSON['vendor_bank_acc'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.duedate))	 // Applied Transaction duedate
										billJSON['duedate'] = srchBillPayments[b].columns.duedate;	
									else
										billJSON['duedate'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.account))	// Account
									{	//billJSON['account'] = srchBillPayments[b].columns.account.name;	
										billJSON['account'] = accName;	
										nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' accName : '+ accName);
									}
									else
										billJSON['account'] = "";

									if(_logValidation(srchBillPayments[b].columns.transactionnumber))	// Transaction Number
										billJSON['transactionnumber'] = srchBillPayments[b].columns.transactionnumber;	
									else
										billJSON['transactionnumber'] = "";
									
									var NetAmount = 0;
									var GrossAmount = 0;
									
									if(_logValidation(srchBillPayments[b].columns.fxamountpaid)) {	
										billJSON['net_amount'] = srchBillPayments[b].columns.fxamountpaid;	// Payment
										NetAmount = Number(srchBillPayments[b].columns.fxamountpaid);
									}
									else
										billJSON['net_amount'] = "";
									
									if(_logValidation(srchBillPayments[b].columns.fxamount))	{ // Total Amount
										billJSON['grossamount'] = srchBillPayments[b].columns.fxamount;	
										GrossAmount = Number(srchBillPayments[b].columns.fxamount);
									}
									else
										billJSON['grossamount'] = "";
								
									var appliedTransType = "";
									if(_logValidation(srchBillPayments[b].columns.type)) {	
										billJSON['apply_type'] = srchBillPayments[b].columns.type.name;	// Applied transaction type
										appliedTransType = srchBillPayments[b].columns.type.internalid;	
										billJSON['apply_type_id'] = appliedTransType;
									}
									else {
										billJSON['apply_type'] = "";
										billJSON['apply_type_id'] = "";
									}
									var tdsAmount = 0.00;
									if(_logValidation(appliedTransId) && _logValidation(appliedTransType)) { // Calculate TDS
										if(appliedTransType == "VendBill") {
											var recordType = 'vendorbill';
											var recordId = appliedTransId;
											var result = calculate_VendBill_TDS(recordType,recordId);
											result = result.split('#');
											billJSON['total_tds'] = result[1];
											tdsAmount = result[1];
											billJSON['tran_date'] = result[0];
											billJSON['ref_no'] = result[3];
											// if(_logValidation(srchBillPayments[b].columns.custbody_transreferenceno))	
												// billJSON['ref_no'] = srchBillPayments[b].columns.custbody_transreferenceno;	// Custom Transaction Ref No
											// else
												// billJSON['ref_no'] = "";
										}
										else if(appliedTransType == "Journal"){
											var recordType = 'journalentry';
											var recordId = appliedTransId;
											var jvRecord = nlapiLoadRecord(recordType,recordId);
											billJSON['total_tds'] = 0.00;
											billJSON['tran_date'] = jvRecord.getFieldValue('trandate');
											billJSON['ref_no'] = jvRecord.getFieldValue('tranid');
										}
									}
									else {
										billJSON['total_tds'] = 0.00;
										billJSON['tran_date'] = "";
										//billJSON['currency'] = "";
									}
									
									billJSON['credit_note'] = (Math.abs(GrossAmount) - NetAmount - tdsAmount); // Credit Note
									
									billPaymentArray.push(billJSON);
								}
							}
							appliedArr.push(appliedTranId);
						}
					}
				}
				else {
					var billJSON = {};
					billJSON['bill_id'] = srchBillPayments[b].id; // Bill Payment internal id
					
					if(_logValidation(srchBillPayments[b].columns.email))	
						billJSON['vendor_email'] = srchBillPayments[b].columns.email;	// Vendor email id
					else
						billJSON['vendor_email'] = "";
					
							if(_logValidation(srchBillPayments[b].columns.custentity_emailid_a))	
								billJSON['vendor_email_a'] = srchBillPayments[b].columns.custentity_emailid_a;	// Vendor email id
							else
								billJSON['vendor_email_a'] = "";
							
							if(_logValidation(srchBillPayments[b].columns.custentity_emailid_b))	
								billJSON['vendor_email_b'] = srchBillPayments[b].columns.custentity_emailid_b;	// Vendor email id
							else
								billJSON['vendor_email_b'] = "";
							
							if(_logValidation(srchBillPayments[b].columns.custentity_emailid_c))	
								billJSON['vendor_email_c'] = srchBillPayments[b].columns.custentity_emailid_c;	// Vendor email id
							else
								billJSON['vendor_email_c'] = "";
					
					var vendorName = "";
					if(_logValidation(srchBillPayments[b].columns.entity)) {	// Vendor Name 
						billJSON['vendor_name'] = srchBillPayments[b].columns.entity.name;
						vendorName = srchBillPayments[b].columns.entity.name;
					}
					else
						billJSON['vendor_name'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.billaddress))	{ // Vendor Address 
						var billAddress = billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
						billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
						billAddress = billAddress ? billAddress.replace(vendorName, "") : "";
						//billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
						billJSON['vendor_bill_addr'] = billAddress;	
					}
					else
						billJSON['vendor_bill_addr'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.trandate)) // Transaction Date
						billJSON['trandate'] = srchBillPayments[b].columns.trandate;	
					else
						billJSON['trandate'] = "";	
					
					if(_logValidation(srchBillPayments[b].columns.amount))	
						billJSON['amount'] = srchBillPayments[b].columns.amount;	// Amount
					else
						billJSON['amount'] = "";	
					
					if(_logValidation(srchBillPayments[b].columns.tranid)) {	
						billJSON['tranid'] = srchBillPayments[b].columns.tranid;	// Tran ID
						billJSON['payment_mode'] = "Cheque"; 
						billJSON['instrument_details'] = srchBillPayments[b].columns.tranid;
					}
					else {
						billJSON['tranid'] = "";
						billJSON['payment_mode'] = "Online";
						billJSON['instrument_details'] = "";
					}
					var appliedTransId = "";
					if(_logValidation(srchBillPayments[b].columns.appliedtotransaction)) {
						billJSON['apply_name'] = srchBillPayments[b].columns.appliedtotransaction.name;	// Applied Transaction
						appliedTransId = srchBillPayments[b].columns.appliedtotransaction.internalid;	
						billJSON['apply_id'] = appliedTransId;
					}	
					else {
						billJSON['apply_name'] = "";
						billJSON['apply_id'] = "";
					}			
					
					// if(_logValidation(srchBillPayments[b].columns.billaddress))	 // Vendor Bank
						// billJSON['vendor_bill_addr'] = srchBillPayments[b].columns.billaddress;	
					// else
						// billJSON['vendor_bill_addr'] = "";
							
					if(_logValidation(srchBillPayments[b].columns.custentity_supplierbank))	 // Vendor Bank
						billJSON['vendor_bank'] = srchBillPayments[b].columns.custentity_supplierbank;	
					else
						billJSON['vendor_bank'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.custentity_beneficiaryacno))	 // Vendor Bank Acc
						billJSON['vendor_bank_acc'] = srchBillPayments[b].columns.custentity_beneficiaryacno;	
					else
						billJSON['vendor_bank_acc'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.duedate))	 // Applied Transaction duedate
						billJSON['duedate'] = srchBillPayments[b].columns.duedate;	
					else
						billJSON['duedate'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.account))	// Account
					{
						billJSON['account'] = srchBillPayments[b].columns.account.name;	
						accName = srchBillPayments[b].columns.account.name;	
					}
					else
						billJSON['account'] = "";

					if(_logValidation(srchBillPayments[b].columns.transactionnumber))	// Transaction Number
						billJSON['transactionnumber'] = srchBillPayments[b].columns.transactionnumber;	
					else
						billJSON['transactionnumber'] = "";
					
					var NetAmount = 0;
					var GrossAmount = 0;
					if(_logValidation(srchBillPayments[b].columns.payingamount)) {	
						billJSON['net_amount'] = srchBillPayments[b].columns.payingamount;	// Payment
						NetAmount = srchBillPayments[b].columns.payingamount;
					}
					else
						billJSON['net_amount'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.grossamount))	{ // Total Amount
						billJSON['grossamount'] = srchBillPayments[b].columns.grossamount;	
						GrossAmount = srchBillPayments[b].columns.grossamount;
					}
					else
						billJSON['grossamount'] = "";
					
					var appliedTransType = "";
					if(_logValidation(srchBillPayments[b].columns.type)) {	
						billJSON['apply_type'] = srchBillPayments[b].columns.type.name;	// Applied transaction type
						appliedTransType = srchBillPayments[b].columns.type.internalid;	
						billJSON['apply_type_id'] = appliedTransType;
					}
					else {
						billJSON['apply_type'] = "";
						billJSON['apply_type_id'] = "";
					}
					var tdsAmount = 0.00;
					if(_logValidation(appliedTransId) && _logValidation(appliedTransType)) { // Calculate TDS
						if(appliedTransType == "VendBill") {
							var recordType = 'vendorbill';
							var recordId = appliedTransId;
							var result = calculate_VendBill_TDS(recordType,recordId);
							result = result.split('#');
							billJSON['total_tds'] = result[1];
							tdsAmount = result[1];
							billJSON['tran_date'] = result[0];
							billJSON['ref_no'] = result[3];
							// if(_logValidation(srchBillPayments[b].columns.custbody_transreferenceno))	
								// billJSON['ref_no'] = srchBillPayments[b].columns.custbody_transreferenceno;	// Custom Transaction Ref No
							// else
								// billJSON['ref_no'] = "";	
						}
						else if(appliedTransType == "Journal"){
							var recordType = 'journalentry';
							var recordId = appliedTransId;
							var jvRecord = nlapiLoadRecord(recordType,recordId);
							billJSON['total_tds'] = 0.00;
							billJSON['tran_date'] = jvRecord.getFieldValue('trandate');
							billJSON['ref_no'] = jvRecord.getFieldValue('tranid');
						}
					}
					else {
						billJSON['total_tds'] = 0.00;
						billJSON['tran_date'] = "";
						billJSON['currency'] = "";
					}
					
					billJSON['credit_note'] = (Math.abs(GrossAmount) - NetAmount - tdsAmount); // Credit Note
					
					billPaymentArray.push(billJSON);
				}
			}
		}
		catch(ex) {
			nlapiLogExecution('ERROR','searchBillPaymentRecord', ex.message);
			nlapiSubmitField('vendorpayment', id, 'custbody_amg_pymt_adv_error', ex.message, true); 
			
		}
		
	}
	return billPaymentArray;
}

function searchJournalRecord(id)
{
	nlapiLogExecution('DEBUG',' searchJournalRecord : ',' id : '+ id);
	var billPaymentArray = new Array();
	if(_logValidation(id)) {
		
		var jvFilters = new Array();
		var jvColumns = new Array();
		jvFilters[0] = new nlobjSearchFilter('internalid', null,'is',id);
		jvColumns[0] = new nlobjSearchColumn('email','vendor'); // Vendor Email	
		try {
			var srchBillPayments = JSON.parse(JSON.stringify(nlapiSearchRecord('journalentry','customsearch_payment_advice_for_journal',jvFilters,jvColumns)));
			nlapiLogExecution('DEBUG',' searchJournalRecord : ',' results : '+ JSON.stringify(srchBillPayments));
			if(_logValidation(srchBillPayments)) {
				for(var b in srchBillPayments) {
					var billJSON = {};
					var currencyName = srchBillPayments[b].columns.currency.name;
					billJSON['bill_id'] = srchBillPayments[b].id; // Bill Payment internal id
					billJSON['currency'] = currencyName; // Currency
					
					if(_logValidation(srchBillPayments[b].columns.entity)) {	// Vendor Name
						billJSON['vendor_name'] = srchBillPayments[b].columns.entity.name;						
						var recInternalId = srchBillPayments[b].columns.entity.internalid;
						nlapiLogExecution('DEBUG',' searchJournalRecord : ',' recInternalId :'+recInternalId);
							
						var filter = new Array();
						var vcolumns = new Array();
						filter[0] = new nlobjSearchFilter('internalid',null,'is',recInternalId);
						vcolumns[0] = new nlobjSearchColumn('email');
						vcolumns[1] = new nlobjSearchColumn('custentity_emailid_a');
						vcolumns[2] = new nlobjSearchColumn('custentity_emailid_b');
						vcolumns[3] = new nlobjSearchColumn('custentity_emailid_c');
						vcolumns[4] = new nlobjSearchColumn('custentity_supplierbank');
						vcolumns[5] = new nlobjSearchColumn('custentity_beneficiaryacno');
						vcolumns[6] = new nlobjSearchColumn('billaddress');						
						
						var srchVendor = JSON.parse(JSON.stringify(nlapiSearchRecord('vendor',null,filter,vcolumns)));
						nlapiLogExecution('DEBUG',' searchJournalRecord : ',' srchVendor : '+ JSON.stringify(srchVendor));
						if(_logValidation(srchVendor)) {
							if(_logValidation(srchVendor[0].columns.email))
								billJSON['vendor_email'] = srchVendor[0].columns.email;
							else
								billJSON['vendor_email'] = "";
							if(_logValidation(srchVendor[0].columns.custentity_emailid_a))
								billJSON['vendor_email_a'] = srchVendor[0].columns.custentity_emailid_a;
							else
								billJSON['vendor_email_a'] = "";
							if(_logValidation(srchVendor[0].columns.custentity_emailid_b))
								billJSON['vendor_email_b'] = srchVendor[0].columns.custentity_emailid_b;
							else
								billJSON['vendor_email_b'] = "";
							if(_logValidation(srchVendor[0].columns.custentity_emailid_c))
								billJSON['vendor_email_c'] = srchVendor[0].columns.custentity_emailid_c;
							else
								billJSON['vendor_email_c'] = "";
							if(_logValidation(srchVendor[0].columns.custentity_supplierbank))
								billJSON['vendor_bank'] = srchVendor[0].columns.custentity_supplierbank;
							else
								billJSON['vendor_bank'] = "";
							if(_logValidation(srchVendor[0].columns.custentity_beneficiaryacno))
								billJSON['vendor_bank_acc'] = srchVendor[0].columns.custentity_beneficiaryacno;
							else
								billJSON['vendor_bank_acc'] = "";
							if(_logValidation(srchVendor[0].columns.billaddress))
								billJSON['vendor_bill_addr'] = srchVendor[0].columns.billaddress;
							else
								billJSON['vendor_bill_addr'] = "";
						}
						// else {
						// 	nlapiLogExecution('DEBUG',' searchJournalRecord : ',' recInternalId :'+recInternalId);
							
						// 	var columns = new Array();
						// 	filter[0] = new nlobjSearchFilter('internalid',null,'is',recInternalId);
						// 	columns[0] = new nlobjSearchColumn('email');
						// 	columns[1] = new nlobjSearchColumn('custentity_emailid_a');
						// 	columns[2] = new nlobjSearchColumn('custentity_emailid_b');
						// 	columns[3] = new nlobjSearchColumn('custentity_emailid_c');
						// 	columns[4] = new nlobjSearchColumn('billaddress');
						// 	var srchCustomer = JSON.parse(JSON.stringify(nlapiSearchRecord('customer',null,filter,columns)));
						// 	nlapiLogExecution('DEBUG',' searchJournalRecord : ',' srchCustomer : '+ JSON.stringify(srchCustomer));
						// 	if(_logValidation(srchCustomer)) {
						// 		if(_logValidation(srchCustomer[0].columns.email))
						// 			billJSON['vendor_email'] = srchCustomer[0].columns.email;
						// 		else
						// 			billJSON['vendor_email'] = "";
						// 		if(_logValidation(srchCustomer[0].columns.custentity_emailid_a))
						// 			billJSON['vendor_email_a'] = srchCustomer[0].columns.custentity_emailid_a;
						// 		else
						// 			billJSON['vendor_email_a'] = "";
						// 		if(_logValidation(srchCustomer[0].columns.custentity_emailid_b))
						// 			billJSON['vendor_email_b'] = srchCustomer[0].columns.custentity_emailid_b;
						// 		else
						// 			billJSON['vendor_email_b'] = "";
						// 		if(_logValidation(srchCustomer[0].columns.custentity_emailid_c))
						// 			billJSON['vendor_email_c'] = srchCustomer[0].columns.custentity_emailid_c;
						// 		else
						// 			billJSON['vendor_email_c'] = "";
						// 		billJSON['vendor_bank'] = "";
						// 		billJSON['vendor_bank_acc'] = "";
						// 		if(_logValidation(srchCustomer[0].columns.billaddress))
						// 			billJSON['vendor_bill_addr'] = srchCustomer[0].columns.billaddress;
						// 		else
						// 			billJSON['vendor_bill_addr'] = "";
						// 	}
						// 	else {
						// 		var srchEmployee = JSON.parse(JSON.stringify(nlapiSearchRecord('employee',null,filter,columns)));
						// 		nlapiLogExecution('DEBUG',' searchJournalRecord : ',' srchEmployee : '+ JSON.stringify(srchEmployee));
						// 		if(_logValidation(srchEmployee)) {
						// 			if(_logValidation(srchEmployee[0].columns.email))
						// 				billJSON['vendor_email'] = srchEmployee[0].columns.email;
						// 			else
						// 				billJSON['vendor_email'] = "";
						// 			if(_logValidation(srchEmployee[0].columns.custentity_emailid_a))
						// 				billJSON['vendor_email_a'] = srchEmployee[0].columns.custentity_emailid_a;
						// 			else
						// 				billJSON['vendor_email_a'] = "";
						// 			if(_logValidation(srchEmployee[0].columns.custentity_emailid_b))
						// 				billJSON['vendor_email_b'] = srchEmployee[0].columns.custentity_emailid_b;
						// 			else
						// 				billJSON['vendor_email_b'] = "";
						// 			if(_logValidation(srchEmployee[0].columns.custentity_emailid_c))
						// 				billJSON['vendor_email_c'] = srchEmployee[0].columns.custentity_emailid_c;
						// 			else
						// 				billJSON['vendor_email_c'] = "";
						// 			billJSON['vendor_bank'] = "";
						// 			billJSON['vendor_bank_acc'] = "";
						// 			if(_logValidation(srchEmployee[0].columns.billaddress))
						// 				billJSON['vendor_bill_addr'] = srchEmployee[0].columns.billaddress;
						// 			else
						// 				billJSON['vendor_bill_addr'] = "";
						// 		}
						// 	}
						// }
					}
					else {
						billJSON['vendor_name'] = "";
						billJSON['vendor_email'] = "";
						billJSON['vendor_email_a'] = "";
						billJSON['vendor_email_b'] = "";
						billJSON['vendor_email_c'] = "";
						billJSON['vendor_bank'] = "";
						billJSON['vendor_bank_acc'] = "";
						billJSON['vendor_bill_addr'] = "";
					}
					
					if(_logValidation(srchBillPayments[b].columns.trandate)) // Transaction Date
						billJSON['trandate'] = srchBillPayments[b].columns.trandate;	
					else
						billJSON['trandate'] = "";	
					
					if(currencyName == "Indian Rupees") {
						if(_logValidation(srchBillPayments[b].columns.amount))	
							billJSON['amount'] = srchBillPayments[b].columns.amount;	// Amount
						else
							billJSON['amount'] = "";
					}
					else {
						if(_logValidation(srchBillPayments[b].columns.fxamount))	
							billJSON['amount'] = Math.abs(srchBillPayments[b].columns.fxamount);	// Amount
						else
							billJSON['amount'] = "";	
					}
					
					if(_logValidation(srchBillPayments[b].columns.tranid)) {	
						billJSON['tranid'] = srchBillPayments[b].columns.tranid;	// Tran ID
						billJSON['payment_mode'] = "Cheque"; 
						billJSON['instrument_details'] = srchBillPayments[b].columns.tranid;
					}
					else {
						billJSON['tranid'] = "";
						billJSON['payment_mode'] = "Online";
						billJSON['instrument_details'] = "";
					}
					
					if(_logValidation(srchBillPayments[b].columns.custbody_invoice_date))	 // Applied Transaction duedate
						billJSON['tran_date'] = srchBillPayments[b].columns.custbody_invoice_date;	
					else
						billJSON['tran_date'] = "";
					
					if(_logValidation(srchBillPayments[b].columns.account))	// Account
						billJSON['account'] = srchBillPayments[b].columns.account.name;							
					else
						billJSON['account'] = "";

					if(_logValidation(srchBillPayments[b].columns.custbody_invoice_number))	// Transaction Number
						billJSON['ref_no'] = srchBillPayments[b].columns.custbody_invoice_number;	
					else
						billJSON['ref_no'] = "";
					
					var NetAmount = 0;
					var GrossAmount = 0;
					
					if(currencyName == "Indian Rupees") {
						if(_logValidation(srchBillPayments[b].columns.creditamount)) {	
							billJSON['net_amount'] = srchBillPayments[b].columns.creditamount;	// Payment
							NetAmount = Number(srchBillPayments[b].columns.creditamount);
						}
						else
							billJSON['net_amount'] = 0.00;
						
						if(_logValidation(srchBillPayments[b].columns.grossamount))	{ // Total Amount
							billJSON['grossamount'] = Math.abs(srchBillPayments[b].columns.grossamount);	
							GrossAmount = Number(srchBillPayments[b].columns.grossamount);
						}
						else
							billJSON['grossamount'] = 0.00;
						
					}
					else {
						if(_logValidation(srchBillPayments[b].columns.fxamount)) {	
							billJSON['amount'] = Math.abs(srchBillPayments[b].columns.fxamount);	// Amount
							billJSON['net_amount'] = Math.abs(srchBillPayments[b].columns.fxamount);	// Amount
							billJSON['grossamount'] = Math.abs(srchBillPayments[b].columns.fxamount);	// Amount
						}
						else {
							billJSON['amount'] = 0.00;	
							billJSON['net_amount'] = 0.00;	
							billJSON['grossamount'] = 0.00;
						}
					}
					
					var tdsAmount = 0.00;
					if(_logValidation(srchBillPayments[b].columns.custcol_tds_base_value_advpay))	// Transaction Number
						tdsAmount = srchBillPayments[b].columns.custcol_tds_base_value_advpay;	
					
					billJSON['total_tds'] = tdsAmount;
					billJSON['credit_note'] = (Math.abs(GrossAmount) - NetAmount - tdsAmount); // Credit Note
					billPaymentArray.push(billJSON);
				}
			}
		}
		catch(ex){
			nlapiLogExecution('ERROR','searchJournalRecord', ex.message);
			nlapiSubmitField('journalentry', id, 'custbody_amg_pymt_adv_error', ex.message, true);
		}
	}
	return billPaymentArray;
}

function removeDuplicates2DArray(arr)
{
	try
	{
		nlapiLogExecution('DEBUG',' removeDuplicates2DArray ',' arr : '+JSON.stringify(arr));
		var uniques = [];
		var itemsFound = {};
		for(var i = 0, l = arr.length; i < l; i++) 
		{
			var stringified = JSON.stringify(arr[i]);
			nlapiLogExecution('DEBUG',' removeDuplicates2DArray ',' stringified : '+stringified);
			if(itemsFound[stringified])
			{
				continue;
			}
			uniques.push(arr[i]);
			nlapiLogExecution('DEBUG',' removeDuplicates2DArray ',' uniques : '+uniques);
			itemsFound[stringified] = true;
		}
		return uniques;
	}
	catch(ex)
	{
		nlapiLogExecution('DEBUG',' removeDuplicates2DArray ',' Error : '+ex.message);
	}
}

function removeEmptyKeys(obj) {
    for (var key in obj) {
      if(key == ""){
          delete obj[key];
      }
    }
    return obj;
}

// Create Payment ADvice PDF
function createPaymentAdvice(data,paymentRecordType)
{
    // nlapiLogExecution('DEBUG','createPaymentAdvice','data :'+JSON.stringify(data));
	var ReportTitle = "Payment Advice";	
	var dataURL = nlapiResolveURL('SUITELET','customscript_sut_tdsexcelreport_line','customdeploy_sut_tdsexcelreport_line',true);	//nlapiLogExecution('DEBUG', 'DataCenterMove', ' dataURL : ' + dataURL);
	var splitpart = dataURL.split('.com');																							//nlapiLogExecution('DEBUG', 'DataCenterMove', ' splitpart : ' + splitpart);
	var urlPath = splitpart[0].concat('.com',nlapiLoadFile(285156).getURL());						//nlapiLogExecution('DEBUG', 'DataCenterMove', ' urlPath : ' + urlPath);																	
	urlPath = nlapiEscapeXML(urlPath);    
	//nlapiLogExecution('DEBUG', 'createPaymentAdvice', ' urlPath : ' + urlPath);
	var jsonObj = "";
	if(paymentRecordType == "Payment")
		jsonObj = DesignPrintHTMLFormat_BillPayment(data);
	else
		jsonObj = DesignPrintHTMLFormat_Jornal(data);
	//nlapiLogExecution('DEBUG', 'createPaymentAdvice', ' message : ' + message);
	message = jsonObj.attachment;

	nlapiLogExecution('DEBUG', 'createPaymentAdvice', 'message: ' + message);
	nlapiLogExecution('DEBUG', 'createPaymentAdvice', 'urlPath: ' + urlPath);

	var xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n";
    xml += "<pdf>\n";
  
    xml += "<head>";
	xml += "<style>";
	xml += "\n";
	xml += "table{table-layout:fixed;}";
	xml += "table.tableborder{border:0.5; border-style:solid;border-color:black;border-width:1px;border-collapse:collapse;}" + "\n";
	xml += "th.thborder{border:0.5; border-style:solid;border-color:black;border-width:1px;border-collapse:collapse;}" + "\n";	
	xml += "td.tdborder{border:0.5; border-style:solid;border-color:black;border-width:1px;border-collapse:collapse;}" + "\n";	
    xml += "<\/style>";
	xml += "<macrolist>";
	xml += "<macro id=\"nlheader\">";
	xml += "<table border=\"0\" cellpadding=\"0\" width=\"100%\">";
		xml += "<tr>";	
		xml += "<td><img height=\"77\" src=\"" + urlPath + "\" width=\"200\" /></td>";
		xml += "<td align=\"right\"> <b>Amagi Media Labs Private Ltd</b> <br /> 4th Floor, Raj Alkaa Park, <br /> Kalena Agrahara Village, Bannerghatta Road <br /> Bangalore - 560076 <br /> e-mail: finance@amagi.com </td>";
		xml += "</tr>";
		xml += "</table>";
	xml += "</macro>";
	xml += "<macro id=\"nlfooter\">";
	xml += "<p align=\"center\"><span style=\"font-size: 9px\">" + "<br/>[ Page <pagenumber/> / <totalpages/> ]" + "</span></p>";
	xml += "</macro>";
	xml += "</macrolist>";	
	xml += "</head>";	
	xml += "<body header=\"nlheader\" header-height=\"30mm\" footer=\"nlfooter\" footer-height=\"10mm\">";
	xml += message;
	//xml += message;
	xml += "</body>";
	
	xml += "\n</pdf>";

	var file = nlapiXMLToPDF(xml);	
	nlapiLogExecution('DEBUG', 'createPaymentAdvice', 'file: ' + JSON.stringify(file));
	//file.setName('Welcome.pdf', 'inline');
	file.setName(ReportTitle + '.pdf');		
	//response.setContentType('PDF', 'Welcome.pdf', 'inline');	
	//response.write(file.getValue());  
	//nlapiLogExecution('DEBUG', 'createPaymentAdvice', ' file : ' + file);	
	//return file + '@' + message[1] + '@' + message[2];
	
	var dataJSON = {};
	dataJSON['attachment'] = file;
	dataJSON['amount'] = jsonObj.amount;
	dataJSON['amount_in_words'] = jsonObj.amount_in_words;

	nlapiLogExecution('DEBUG', 'createPaymentAdvice', 'urlPath: ' + JSON.stringify(dataJSON));
	return dataJSON;
}

function DesignPrintHTMLFormat_BillPayment(data)
{

	//removeDuplicates2DArray(data);
	var filterData = {};
	data = data.filter(function(currentObject) {
		if (currentObject.apply_id in filterData) {
			return false;
		} else {
			filterData[currentObject.apply_id] = true;
			return true;
		}
	});

    filterData = removeEmptyKeys(filterData);
	
	nlapiLogExecution('DEBUG','DesignPrintHTMLFormat_BillPayment','data :'+JSON.stringify(filterData));
   
	var ReportTitle = "Payment Advice";	
	var strhtml = '';
	var lineNo = 1;
	
	strhtml = "<table cellspacing=\"0\" cellpadding=\"3px\" border=\"0\" width=\"100%\" style=\"border-top-none;border-left-none;border-right-noe;border-bottom-style:none;border-collapse:collapse\">";
	
	// Add Blank Line
	strhtml += "<tr>";
		strhtml += "<td height=\"20\">";
		strhtml += "</td>";
	strhtml += "</tr>";
				
	strhtml += "<tr>";
		strhtml += "<TD colspan=\"7\" align=\"center\" font-size=\"14\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b>"+ReportTitle+"</b><\/TD>";								
	strhtml += "</tr>";
	
	if(_logValidation(data)) {
		var billInternalId = "";
		var invAmountTotal = 0, invTDSTotal = 0, invAdvCredTotal = 0, invNetTotal = 0;
		var paymentMode = "", instrumentDetails = "", issuedFrom = "", Amount = 0;
		var currencyFormat = "";
		
		for(var d in data) {
			if(data[d].apply_id != "") {
				var id = data[d].bill_id;
				//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_BillPayment', ' id : ' + id);
				//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_BillPayment', ' billInternalId : ' + billInternalId);
				if(billInternalId == id) {
					lineNo++;
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+lineNo+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].ref_no+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].tran_date+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].grossamount).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].total_tds).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].credit_note).toFixed(2)+"</span></strong></td>"; 
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].net_amount).toFixed(2)+"</span></strong></td>";
					strhtml += "</tr>";
					
					invAmountTotal = invAmountTotal + data[d].grossamount;
					invTDSTotal = parseInt(invTDSTotal) + parseInt(data[d].total_tds);
					invAdvCredTotal = invAdvCredTotal + data[d].credit_note;
					invNetTotal = invNetTotal + data[d].net_amount;
					
				}
				else {
					// Add Blank Line
					strhtml += "<tr>";
						strhtml += "<td height=\"20\">";
						strhtml += "</td>";
					strhtml += "</tr>";
				
					// Add Vendor name and Date 
			
					strhtml += "<tr>";
						strhtml += "<TD colspan=\"4\" align=\"left\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b> M/S "+nlapiEscapeXML(data[d].vendor_name)+"</b><br />"+nlapiEscapeXML(data[d].vendor_bill_addr)+"<\/TD>";	//Vendor Name							
						strhtml += "<TD colspan=\"3\" align=\"right\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b> Date : "+data[d].trandate+"</b><\/TD>";	//Date							
					strhtml += "</tr>";
				
					strhtml += "<tr>";
						strhtml += "<td height=\"20\">";
						strhtml += "</td>";
					strhtml += "</tr>";
					
					// Add Greetings 
					strhtml += "<tr>";
						strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"> Dear Sir/Madam,<br /><br /> Please find below the payment details :<\/TD>";						
					strhtml += "</tr>";
					
					strhtml += "<tr>";
						strhtml += "<td height=\"15\">";
						strhtml += "</td>";
					strhtml += "</tr>";
					
					// Add Invoice details
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>SI.No</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Number</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Date</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Amount</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>TDS</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Advance / Credit  <br/> Note Adjusted</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Net</b></span></strong></td>";
					strhtml += "</tr>";
					
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+lineNo+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].ref_no+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].tran_date+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].grossamount).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].total_tds).toFixed(2)+"</span></strong></td>"; 
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].credit_note).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].net_amount).toFixed(2)+"</span></strong></td>";
					strhtml += "</tr>";
					
					invAmountTotal = invAmountTotal + data[d].grossamount;
					invTDSTotal = parseInt(invTDSTotal) + parseInt(data[d].total_tds);
					invAdvCredTotal = invAdvCredTotal + data[d].credit_note;
					invNetTotal = invNetTotal + data[d].net_amount;
					
					paymentMode = data[d].payment_mode;
					instrumentDetails = data[d].instrument_details;
					issuedFrom = data[d].account;
					billInternalId = id;
					currencyFormat = data[d].currency;
				}	
			}
		}		
		if(_logValidation(invAmountTotal))
		{
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"left\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">TOTAL</span></strong></td>";
				//strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"></span></strong></td>";
				//strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"></span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(Math.abs(invAmountTotal)).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invTDSTotal).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invAdvCredTotal).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invNetTotal).toFixed(2)+"</span></strong></td>";
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Add Payment Details
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Payment Mode</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"2\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Instrument Details</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Issued From</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Amount</b></span></strong></td>";
			strhtml += "</tr>";
			
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+paymentMode+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"2\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+instrumentDetails+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+issuedFrom+"</span></strong></td>";
				//strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+currencyFormat+ '<br />' + invNetTotal.toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\">";
					strhtml += "<table border=\"0\" >";
						strhtml += "<tr>";
							strhtml += "<td align=\"left\"><strong><span style=\"font-size: 12px\">"+currencyFormat+"</span></strong></td>";
						strhtml += "</tr>";
						strhtml += "<tr>";						
						strhtml += "<td align=\"right\"><strong><span style=\"font-size: 12px\">"+ parseFloat(invNetTotal).toFixed(2)+"</span></strong></td>";
						strhtml += "</tr>";
					strhtml += "</table>";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Amount in Words
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b><u>Amount in Words.</u></b><\/TD>";								
			strhtml += "</tr>";
			
			var amtInWords = CheckAmountStringConversion(invNetTotal);
			if(currencyFormat != "Indian Rupees")
					amtInWords = amtInWords ? amtInWords.replace("Paise", "") : "";
			
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\">("+currencyFormat+ ' ' + amtInWords+").<\/TD>";								
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\">Thank you, <br /><br /> <b> For Amagi Media Labs Pvt Ltd </b><br /><br /><br /> Finance Team.<\/TD>";								
			strhtml += "</tr>";
		}
	}
	strhtml += "</table>";
	var dataJSON = {};
	dataJSON['attachment'] = strhtml;
	dataJSON['amount'] = invNetTotal;
	dataJSON['amount_in_words'] = amtInWords;
	return dataJSON;
	//return strhtml;
}

function DesignPrintHTMLFormat_Jornal(data)
{
	var ReportTitle = "Payment Advice";	
	var strhtml = '';
	var lineNo = 1;
	
	strhtml = "<table cellspacing=\"0\" cellpadding=\"3px\" border=\"0\" width=\"100%\" style=\"border-top-none;border-left-none;border-right-noe;border-bottom-style:none;border-collapse:collapse\">";
	
	// Add Blank Line
	strhtml += "<tr>";
		strhtml += "<td height=\"20\">";
		strhtml += "</td>";
	strhtml += "</tr>";
				
	strhtml += "<tr>";
		strhtml += "<TD colspan=\"7\" align=\"center\" font-size=\"14\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b>"+ReportTitle+"</b><\/TD>";								
	strhtml += "</tr>";
	
	if(_logValidation(data)) {
		var billInternalId = "";
		var invAmountTotal = 0, invTDSTotal = 0, invAdvCredTotal = 0, invNetTotal = 0;
		var paymentMode = "", instrumentDetails = "", issuedFrom = "", Amount = 0;
		var currencyFormat = "";
		
		for(var d in data) {
			if(data[d].apply_id != "") {
				var id = data[d].bill_id;
				//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' id : ' + id);
				//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' billInternalId : ' + billInternalId);
				if(billInternalId == id) {
					lineNo++;
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+lineNo+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].ref_no+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].tran_date+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].grossamount).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].total_tds).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].credit_note).toFixed(2)+"</span></strong></td>"; 
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].net_amount).toFixed(2)+"</span></strong></td>";
					strhtml += "</tr>";
					
					invAmountTotal = invAmountTotal + data[d].grossamount;
					invTDSTotal = parseInt(invTDSTotal) + parseInt(data[d].total_tds);
					invAdvCredTotal = invAdvCredTotal + data[d].credit_note;
					invNetTotal = invNetTotal + data[d].net_amount;
					
				}
				else {
					// Add Blank Line
					strhtml += "<tr>";
						strhtml += "<td height=\"20\">";
						strhtml += "</td>";
					strhtml += "</tr>";
				
					// Add Vendor name and Date 
			
					strhtml += "<tr>";
						strhtml += "<TD colspan=\"4\" align=\"left\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b> M/S "+nlapiEscapeXML(data[d].vendor_name)+"</b><br />"+nlapiEscapeXML(data[d].vendor_bill_addr)+"<\/TD>";	//Vendor Name							
						strhtml += "<TD colspan=\"3\" align=\"right\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b> Date : "+data[d].trandate+"</b><\/TD>";	//Date							
					strhtml += "</tr>";
				
					strhtml += "<tr>";
						strhtml += "<td height=\"20\">";
						strhtml += "</td>";
					strhtml += "</tr>";
					
					// Add Greetings 
					strhtml += "<tr>";
						strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"11\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"> Dear Sir/Madam,<br /><br /> Please find below the payment details :<\/TD>";						
					strhtml += "</tr>";
					
					strhtml += "<tr>";
						strhtml += "<td height=\"15\">";
						strhtml += "</td>";
					strhtml += "</tr>";
					
					// Add Invoice details
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>SI.No</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Number</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Date</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Invoice  <br/>Amount</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>TDS</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Advance / Credit  <br/> Note Adjusted</b></span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Net</b></span></strong></td>";
					strhtml += "</tr>";
					
					strhtml += "<tr>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+lineNo+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].ref_no+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+data[d].tran_date+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].grossamount).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].total_tds).toFixed(2)+"</span></strong></td>";
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].credit_note).toFixed(2)+"</span></strong></td>"; 
						strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(data[d].net_amount).toFixed(2)+"</span></strong></td>";
					strhtml += "</tr>";
					
					invAmountTotal = invAmountTotal + data[d].grossamount;
					invTDSTotal = parseInt(invTDSTotal) + parseInt(data[d].total_tds);
					invAdvCredTotal = invAdvCredTotal + data[d].credit_note;
					invNetTotal = invNetTotal + data[d].net_amount;
					
					paymentMode = data[d].payment_mode;
					instrumentDetails = data[d].instrument_details;
					issuedFrom = data[d].account;
					billInternalId = id;
					currencyFormat = data[d].currency;
				}	
			}
		}		
		if(_logValidation(invAmountTotal))
		{
			//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' invAmountTotal : ' + invAmountTotal);
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"left\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">TOTAL</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invAmountTotal).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invTDSTotal).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invAdvCredTotal).toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+parseFloat(invNetTotal).toFixed(2)+"</span></strong></td>";
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Add Payment Details
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Payment Mode</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"2\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Instrument Details</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Issued From</b></span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\"><b>Amount</b></span></strong></td>";
			strhtml += "</tr>";
			
			strhtml += "<tr>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+paymentMode+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"2\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+instrumentDetails+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" colspan=\"3\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid;\"><strong><span style=\"font-size: 12px\">"+issuedFrom+"</span></strong></td>";
				//strhtml += "<td class=\"tdborder\" align=\"right\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\"><strong><span style=\"font-size: 12px\">"+currencyFormat+ '<br />' + invNetTotal.toFixed(2)+"</span></strong></td>";
				strhtml += "<td class=\"tdborder\" align=\"center\" style=\"border-left: thin solid; border-top: thin solid; border-bottom: thin solid; border-right: thin solid;\">";
					strhtml += "<table border=\"0\" >";
						strhtml += "<tr>";
							strhtml += "<td align=\"left\"><strong><span style=\"font-size: 12px\">"+currencyFormat+"</span></strong></td>";
						strhtml += "</tr>";
						strhtml += "<tr>";						
						strhtml += "<td align=\"right\"><strong><span style=\"font-size: 12px\">"+ parseFloat(invNetTotal).toFixed(2)+"</span></strong></td>";
						strhtml += "</tr>";
					strhtml += "</table>";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			// Amount in Words
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\"><b><u>Amount in Words.</u></b><\/TD>";								
			strhtml += "</tr>";
			//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' invNetTotal : ' + invNetTotal);
			var  amtInWords = CheckAmountStringConversion(invNetTotal);
			//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' amtInWords : ' + amtInWords);
			if(currencyFormat != "Indian Rupees")
					amtInWords = amtInWords ? amtInWords.replace("Paise", "") : "";
			
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\">("+currencyFormat+ ' ' + amtInWords+").<\/TD>";								
			strhtml += "</tr>";
			
			// Add Blank Line
			strhtml += "<tr>";
				strhtml += "<td height=\"12\">";
				strhtml += "</td>";
			strhtml += "</tr>";
			
			strhtml += "<tr>";
				strhtml += "<TD colspan=\"7\" align=\"left\" font-size=\"12\" style=\"border-left-style:none;border-top-style:none;border-bottom-none;\">Thank you, <br /><br /> <b> For Amagi Media Labs Pvt Ltd </b><br /><br /><br /> Finance Team.<\/TD>";								
			strhtml += "</tr>";
			//nlapiLogExecution('DEBUG', 'DesignPrintHTMLFormat_Jornal', ' End : ');
		}
	}
	strhtml += "</table>";
	//var amtInWords = "";
	var dataJSON = {};
	dataJSON['attachment'] = strhtml;
	dataJSON['amount'] = invNetTotal;
	dataJSON['amount_in_words'] = amtInWords;
	return dataJSON;
	//return strhtml;
}

function calculate_VendBill_TDS(RecordType, RecordId)
{
	try {
		//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' RecordType : ' + RecordType);
		//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' RecordId : ' + RecordId);
		// [TDS Details]
		var tempTDSBaseAmount = 0;
		var tempTotalTDSAmount = 0;
		var TDSBaseAmount = 0;
		var TotalTDSAmount = 0;
		var Count = 0;
		// Load Record
		var objRecord = nlapiLoadRecord(RecordType,RecordId);
		//var tranDate = objRecord.getFieldValue('trandate');
		var refNo = objRecord.getFieldValue('tranid');
		var tranDate = objRecord.getFieldValue('custbody_invoice_date');
		var CurrencyID = objRecord.getFieldValue('currency');
		//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' CurrencyID : ' + CurrencyID);
		var CurrencySymbol = SearchCurrencySymbol(parseInt(CurrencyID,10));
		//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' CurrencySymbol : ' + CurrencySymbol);
		var type = 'expense';
		Count = objRecord.getLineItemCount(type);
		//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' TDS Line Item Count : ' + Count);
		var Index = 0;	
		for(Index = 1; Index <= Count; Index++)	{
			var b_applyTDS = objRecord.getLineItemValue(type, 'custcol_apply_tds_line', Index);
			var b_overrideTDS = objRecord.getLineItemValue(type, 'custcol_override_tds_line', Index);
			//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' b_applyTDS : ' + b_applyTDS);
			//nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' b_overrideTDS : ' + b_overrideTDS);
			
			if((b_applyTDS == 'T') || (b_overrideTDS == 'T'))			{
				tempTDSBaseAmount = parseFloat(objRecord.getLineItemValue(type, 'custcol_tds_base_amount_actual_line', Index));
				if(!isNaN(tempTDSBaseAmount)) {
					TDSBaseAmount = TDSBaseAmount + tempTDSBaseAmount;
				}
				tempTotalTDSAmount = parseFloat(objRecord.getLineItemValue(type, 'custcol_total_tds_actual_line', Index));
				if(!isNaN(tempTotalTDSAmount)) {
					TotalTDSAmount = TotalTDSAmount + tempTotalTDSAmount;
				}			
			}
		}
		var NetPayAmount = parseFloat(objRecord.getFieldValue('total')) - parseFloat(TotalTDSAmount);
		NetPayAmount = parseFloat(NetPayAmount).toFixed(2);
		if( (isNaN(NetPayAmount)) )//(TDSBaseAmount == 0)
		{
			NetPayAmount = CurrencySymbol + ' ' + '0.00';
		}
		else
		{
			NetPayAmount = CurrencySymbol + ' ' + NumericFormatToCurrencyFormat(NetPayAmount,"$");
		}
		nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' NetPayAmount : ' + NetPayAmount);
		
		// [TDSBaseAmount]
		TDSBaseAmount = parseFloat(TDSBaseAmount).toFixed(2);
		if( (isNaN(TDSBaseAmount)) )//(TDSBaseAmount == 0)
		{
			TDSBaseAmount = CurrencySymbol + ' ' + '0.00';
		}
		else
		{
			TDSBaseAmount = CurrencySymbol + ' ' + NumericFormatToCurrencyFormat(TDSBaseAmount,"$");
		}
		
		// [TotalTDSAmount]
		TotalTDSAmount = parseFloat(TotalTDSAmount).toFixed(2);
		if( (isNaN(TotalTDSAmount)) )//(TotalTDSAmount == 0)
		{
			//TotalTDSAmount = CurrencySymbol + ' ' + '0.00';
			TotalTDSAmount = '0.00';
		}
		else
		{
			//TotalTDSAmount = CurrencySymbol + ' ' + NumericFormatToCurrencyFormat(TotalTDSAmount,"$");
			TotalTDSAmount = NumericFormatToCurrencyFormat(TotalTDSAmount,"$");
		}
		 
		nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' TDSBaseAmount : ' + TDSBaseAmount);
		nlapiLogExecution('DEBUG', 'calculate_VendBill_TDS', ' TotalTDSAmount : ' + TotalTDSAmount);
		return tranDate + '#' + String(TotalTDSAmount).replace(/,/g, "") + '#' + CurrencySymbol + '#' + refNo;
	}
	catch(ex) {
		throw ex.message;
	}
	
}

function SearchCurrencySymbol(CurrencyID)
{
	
	// 1 	[INR][Rs]	[&#8360;]		
	// 2 	[USD][$]	[&#36;]
	// 3 	[CAD][$]	[&#36;]		
	// 4 	[EUR][�]	[&#8364;]	
	// 5 	[GBP][�]	[&#163;]
		
	// 6 	[AUD][$]	[&#36;]
	// 7 	[BRL][R$]	[&#36;]
	// 8 	[JPY][�]	[&#165;]
	// 9 	[SGD][S$]	[&#36;]
	// 10 	[NZD][$]	[&#36;]
	// 11 	[CNY][�]	[&#165;]
	
	var CurrencySymbol = '';
	
	switch(CurrencyID)
	{	
		case 1:
				//CurrencySymbol = '&#8360;';
				CurrencySymbol = 'Rs';
				break;	
		case 2:
				CurrencySymbol = '&#36;';
				break;				
		case 3:
				CurrencySymbol = '&#36;';
				break;
		case 4:
				CurrencySymbol = '&#8364;';
				break;
		case 5:
				CurrencySymbol = '&#163;';				
				break;
		// case 6:
				// CurrencySymbol = '&#36;';
				// break;		
		// case 7:
				// CurrencySymbol = 'R' + '&#36;';
				// break;		
		// case 8:
				// CurrencySymbol = '&#165;';
				// break;		
		// case 9:
				// CurrencySymbol = 'S' + '&#36;';
				// break;		
		// case 10:
				// CurrencySymbol = '&#36;';
				// break;		
		// case 11:
				// CurrencySymbol = '&#165;';
				// break;		
		default:
				CurrencySymbol = '';
				break;
	}	
	//OR
	// var RecordArray = new Array();
	// RecordArray = SearchCurrencyRecord(CurrencyID);
	// CurrencySymbol = RecordArray['DisplaySymbol'];
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' ID : ' + RecordArray['ID']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' Name : ' + RecordArray['Name']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' ISOSymbol : ' + RecordArray['ISOSymbol']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' DisplaySymbol : ' + RecordArray['DisplaySymbol']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' BaseCurrency : ' + RecordArray['BaseCurrency']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' ExchangeRate : ' + RecordArray['ExchangeRate']);
	// nlapiLogExecution('DEBUG','SearchCurrencyRecord',' AutomaticUpdate : ' + RecordArray['AutomaticUpdate']);

	return CurrencySymbol;
	
}

function NumericFormatToCurrencyFormat(N,CurrencySymbol)
{
	//if CurrencySymbol = "$";	
	return N.replace(/(\d)(?=(\d{3})+\.)/g, "$1,");
}

function CheckAmountStringConversion(totalAmount) // From Numeric Format To String Format
{
	var subCurr = 'Paise';
	var amtInWrds = "";
	if (totalAmount == 0) 
	{
		//var ZeroWord = 'Zero Only';
		amtInWrds = 'Zero Only';
	}
	else
	{
	 	var amtstr = ConversionInToWords(totalAmount);
		var v = 0;
		v = amtstr.search('And');
		if (v != -1)
			amtstr = amtstr + subCurr;
		amtstr = amtstr + ' Only';		
		//var amtInWrds = amtstr;   		 
		amtInWrds = amtstr;   		 
	}
	return amtInWrds;
}

function formatAndReplaceSpacesofMessage(messgaeToBeSendPara)
{
	
	    messgaeToBeSendPara = messgaeToBeSendPara.toString();
	    //nlapiLogExecution('DEBUG', 'In formatAndReplaceSpacesofMessage', "  messgaeToBeSend.toString() =====" + messgaeToBeSendPara);
	    
	    messgaeToBeSendPara = messgaeToBeSendPara.replace("<br/>", "\n"); 
	    nlapiLogExecution('DEBUG', 'In formatAndReplaceSpacesofMessage', "  messgaeToBeSend After Replcing spaces with % =====" + messgaeToBeSendPara);
	    
	    return messgaeToBeSendPara;
}

function RE_StringReplacement(StringExpression,pattern,modifiers,ReplacementString)
{	
	// nlapiLogExecution('DEBUG',' RE_StringReplacement ',' TEST : RE_StringReplacement ');
	// Argument/Parameter Data Type : String (i.e. String Object)

	var objRegExp = new RegExp(pattern,modifiers);
	// nlapiLogExecution('DEBUG',' RE_StringReplacement ',' objRegExp : ' + objRegExp);	
	
	var SearchValue = objRegExp;
	var ReplaceValue = ReplacementString;
	
	StringExpression = StringExpression.replace(SearchValue,ReplaceValue);
	// nlapiLogExecution('DEBUG',' RE_StringReplacement ',' StringExpression : ' + StringExpression);	
	return StringExpression;
}

function ConversionInToWords(amount)
{
    var str = " ";
	var tempAmt = amount;
	
	amount = amount.toString();	
	var th  = new Array ('Crore ','Lakhs ','Thousand ','Hundred ');
	// uncomment this line for English Number System

	// var th = ['','thousand','million', 'milliard','billion'];
	var dg = new Array ('10000000','100000','1000','100');

	var dem = amount.substr(amount.lastIndexOf('.')+1)
	amount = parseInt(amount)
	//nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' amount 0: '+amount);
	
    var d
    var n1,n2
    while(amount>=100)
    {
       for(var k=0;k<4;k++)
        {

		    d=parseInt(amount/dg[k])

		    if(d>0)
		    {
                if(d>=20)
                {

                    n1=parseInt(d/10)

                    n2=d%10

                    printnum2(n1)
                    printnum1(n2)
                }
     			 else
      				printnum1(d)
     			str=str+th[k]
				 }
			amount=amount%dg[k]
			//nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' amount : '+amount);
        }
    }
	//nlapiLogExecution('DEBUG',' PaymentAdviceResult : ',' amount 1: '+amount);
	 if(amount>=20)
	 {
	            n1=parseInt(amount/10)
	            n2=amount%10
	 }
	 else
	 {
	            n1=0
	            n2=amount
	 }

	printnum2(n1)
	printnum1(n2)
	if(dem>0 && dem !=tempAmt)
	{
		decprint(dem)
	}
	return str

	function decprint(nm)
	{

         if(nm>=20)
	     {
            n1=parseInt(nm/10)
            n2=nm%10
	     }
		  else
		  {
		              n1=0
		              n2=parseInt(nm)
		  }

		  str=str+'And '

		  printnum2(n1)

	 	  printnum1(n2)
	}

	function printnum1(num1)
	{

        switch(num1)
        {
			  case 1:str=str+'One '
			         break;
			  case 2:str=str+'Two '
			         break;
			  case 3:str=str+'Three '
			        break;
			  case 4:str=str+'Four '
			         break;
			  case 5:str=str+'Five '
			         break;
			  case 6:str=str+'Six '
			         break;
			  case 7:str=str+'Seven '
			         break;
			  case 8:str=str+'Eight '
			         break;
			  case 9:str=str+'Nine '
			         break;
			  case 10:str=str+'Ten '
			         break;
			  case 11:str=str+'Eleven '
			        break;
			  case 12:str=str+'Twelve '
			         break;
			  case 13:str=str+'Thirteen '
			         break;
			  case 14:str=str+'Fourteen '
			         break;
			  case 15:str=str+'Fifteen '
			         break;
			  case 16:str=str+'Sixteen '
			         break;
			  case 17:str=str+'Seventeen '
			         break;
			  case 18:str=str+'Eighteen '
			         break;
			  case 19:str=str+'Nineteen '
			         break;
		}
	}
	function printnum2(num2)
	{

		switch(num2)
		{
				  case 2:str=str+'Twenty '
				         break;
				  case 3:str=str+'Thirty '
				        break;
				  case 4:str=str+'Forty '
				         break;
				  case 5:str=str+'Fifty '
				         break;
				  case 6:str=str+'Sixty '
				         break;
				  case 7:str=str+'Seventy '
				         break;
				  case 8:str=str+'Eighty '
				         break;
				  case 9:str=str+'Ninety '
				         break;
        }

	}
}
//Function - To create 'Return To Criteria' button 
function addReturnButton(form,request)
{
	var url = nlapiResolveURL('SUITELET','customscript_amagi_sut_paymentadvice_cr', 'customdeploy_amagi_sut_paymentadvice_cr');
	var script = "{ window.location = '" + url + "'}";
	form.addButton('criteriabutton', 'Return to Criteria', script);
}

function _logValidation(value)
{
    if (value != null && value != '' && value != undefined) 
	    return true;
    else
	    return false;
}

function checkUnitConsumption() {
	try {
	  // Get the current unit consumption
	  var unitsUsed = nlapiGetContext().getUsage();
  
	  // Log the unit consumption to the script execution log
	  nlapiLogExecution('DEBUG', 'Unit Consumption', 'Units Used: ' + unitsUsed);
  
	  // You can add additional logic here to take actions based on unit consumption if needed.
  
	} catch (ex) {
	  // Handle any errors that may occur
	  nlapiLogExecution('ERROR', 'Error', ex.toString());
	}
  }