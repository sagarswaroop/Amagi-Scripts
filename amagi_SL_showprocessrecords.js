/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 *@author Sagar Kumar
 *@description It will be used to display the total number of records with remain and processed records.
 */

define(["N/search", "N/ui/serverWidget", "N/record", "N/url"], function (
  search,
  serverWidget,
  record,
  url
) {
  function _logValidation(value) {
    if (value != null && value != "" && value != undefined) return true;
    else return false;
  }

  function getBillPaymentInfo(startDate, endDate) {
    var searchResultCount = 0;
    try {
      var vendorpaymentSearchObj = search.create({
        type: "vendorpayment",
        filters: [
          ["custbody_payment_advice_flag", "is", "F"],
          "AND",
          ["type", "anyof", "VendPymt"],
          "AND",
          ["trandate", "within", startDate, endDate],
          "AND",
          ["mainline", "is", "T"],
          "AND",
          ["custbody_amg_pymt_adv_error", "isempty", ""],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      searchResultCount = vendorpaymentSearchObj.runPaged().count;

      log.debug("searchResultCount of payment records count: " + searchResultCount);
    } catch (error) {
      log.error("Error", error);
    }

    return searchResultCount;
  }

  function getJournalEntryInfo(startDate, endDate) {
    var searchResultCount = 0;
    try {
      var journalEntryTotal = search.create({
        type: "journalentry",
        filters: [
          ["custbody_payment_advice_flag", "is", "F"],
          "AND",
          ["type", "anyof", "Journal"],
          "AND",
          ["trandate", "within", startDate, endDate],
          "AND",
          ["line", "equalto", "1"],
          "AND",
          ["custbody_amg_pymt_adv_error", "isempty", ""],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });


      searchResultCount = journalEntryTotal.runPaged().count;
    } catch (error) {
      log.error("Error", error);
    }

    return searchResultCount;

  }

  

  function onRequest(context) {
    if (context.request.method === "GET") {
      var startDate = context.request.parameters.custscript_adv_start_date;
      var endDate = context.request.parameters.custscript_adv_end_date;
      var empId = context.request.parameters.custscript_userid;
      // Create a form
      log.debug("startDate", startDate);
      log.debug("endDate", endDate);

      var billPaymentResult = getBillPaymentInfo(startDate, endDate);

      log.debug("billPaymentResult", billPaymentResult);

      var journalEntryResult = getJournalEntryInfo(startDate, endDate);

      log.debug("journalEntryResult", journalEntryResult);

      let searchResultCount = parseInt(journalEntryResult) + parseInt(billPaymentResult);


  

      if (searchResultCount > 0) {
        var form = serverWidget.createForm({
          title: "Payment records are processing...",
        });

        form.clientScriptFileId = 472247;

        var htmlData = form.addField({
          id: "custpage_show_html",
          type: serverWidget.FieldType.INLINEHTML,
          label: "inline html",
        });

        // form.addButton({
        //   id: "custpage_refresh_btn",
        //   label: "Refresh",
        //   functionName: "RefreshData("+startDate+","+endDate+")",
        // });

        // Set field values
        htmlData.defaultValue =
          "<h4>Payment Advice Summary</br>Greetings from NetSuite!</br>Thank you for using the Payment Advice Process. The Process is Initiated.</br></br><span id='proreccssid'>"+searchResultCount+" Records are processing...</span></h4>";
        // startDateField.defaultValue = startDate;
        // endDateField.defaultValue = endDate;
      } else {
        var form = serverWidget.createForm({
          title: "No record found for selected date",
        });

        // Add a return button to go back to the previous page
        form.addButton({
          id: "custpage_return_button",
          label: "Return",
          functionName: "backtoPage",
        });

        // Add a client script to handle the button click
        form.clientScriptModulePath = "./amg_CS_pay_adv_renderPages.js";
      }
      // Display the form
      context.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };
});
