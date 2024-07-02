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
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      searchResultCount = vendorpaymentSearchObj.runPaged().count;
    } catch (error) {
      log.error("Error", "Error");
    }

    return searchResultCount;
  }

  function getJournalEntryInfo(startDate, endDate) {
    var searchResultCount = 0;
    try {
      var journalEntryTotal = search.create({
        type: "vendorpayment",
        filters: [
          ["custbody_payment_advice_flag", "is", "F"],
          "AND",
          ["type", "anyof", "Journal"],
          "AND",
          ["trandate", "within", startDate, endDate],
          "AND",
          ["line", "equalto", "1"],
        ],
        columns: [
          search.createColumn({ name: "internalid", label: "Internal ID" }),
        ],
      });
      searchResultCount = journalEntryTotal.runPaged().count;
    } catch (error) {
      log.error("Error", "Error");
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

      var journalEntryResult = getJournalEntryInfo(startDate, endDate);

      let searchResultCount = parseInt(journalEntryResult) + parseInt(billPaymentResult);
  

      if (searchResultCount > 0) {
        var form = serverWidget.createForm({
          title: "Payment records are processing...",
        });

        form.clientScriptFileId = 472247;

        var statusField = form.addField({
          id: "custpage_status",
          type: serverWidget.FieldType.DATE,
          label: "Start date",
        });

        var htmlData = form.addField({
          id: "custpage_show_html",
          type: serverWidget.FieldType.INLINEHTML,
          label: "inline html",
        });

        var processedBy = form.addField({
          id: "custpage_processed_by",
          type: serverWidget.FieldType.TEXT,
          label: "Processed by",
        });

        var processedDate = form.addField({
          id: "custpage_processed_date",
          type: serverWidget.FieldType.DATE,
          label: "Processed Date",
        });

        // Add a field to display total records
        var totalRecordsField = form.addField({
          id: "custpage_total_records",
          type: serverWidget.FieldType.INTEGER,
          label: "Number of records Loaded",
        });

        // Add a field to display remaining records
        // var remainingRecordsField = form.addField({
        //   id: "custpage_remaining_records",
        //   type: serverWidget.FieldType.INTEGER,
        //   label: "Number of records in Process",
        // });

        // form.addButton({
        //   id: "cust_bttn_refresh",
        //   label: "Refresh",
        //   functionName: 'refreshPage'
        // })
        totalRecordsField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

        // remainingRecordsField.updateDisplayType({
        //   displayType: serverWidget.FieldDisplayType.INLINE,
        // });

        processedDate.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

        processedBy.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.INLINE,
        });

        statusField.updateDisplayType({
          displayType: serverWidget.FieldDisplayType.HIDDEN,
          //   displayType: serverWidget.FieldDisplayType.INLINE,
        });

        htmlData.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDE,
        });

        // processedBy.updateLayoutType({
        //   layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW,
        // });

        processedDate.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.MIDROW,
        });

        totalRecordsField.updateLayoutType({
          layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW,
        });

        // remainingRecordsField.updateLayoutType({
        //     layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW,
        // });

        let employEmail = record
          .load({
            type: record.Type.EMPLOYEE,
            id: empId,
          })
          .getValue({
            fieldId: "email",
          });

        // Set field values
        htmlData.defaultValue =
          "<b>Payment Advice Summary</br>Greetings from NetSuite!</br>Thank you for using the Payment Advice Process. The Process is Initiated.</b>";
        processedBy.defaultValue = employEmail;
        processedDate.defaultValue = new Date();
        totalRecordsField.defaultValue = searchResultCount;
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
        form.clientScriptModulePath = "./amagi_CS_refreshprocessData.js";
      }
      // Display the form
      context.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };
});
