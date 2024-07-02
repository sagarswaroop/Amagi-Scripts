/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

var currentRecord = {};
var tranType = "payments";
define(["N/url"], function (url) {
  function fieldChanged(context) {
    const urlParams = new URLSearchParams(window.location.search);
    // Retrieve specific parameters by name
    const sDateParamValue = urlParams.get("start_date"); // Retrieves 'value1'
    const eDateParamValue = urlParams.get("end_date"); // Retrieves 'value2'

    log.debug(
      "sDateParamValue: " +
        sDateParamValue +
        " eDateParamValue: " +
        eDateParamValue
    );
    // Navigate to selected page
    debugger;
    if (context.fieldId == "custpage_pageid") {
      var pageId = context.currentRecord.getValue({
        fieldId: "custpage_pageid",
      });

      const type = urlParams.get("tran_type");

      if (type) {
        tranType = type;
      }

      // var tranType = currentRecord.getValue({
      //   fieldId: "custpage_transaction_type",
      // }) || "payments";

      pageId = parseInt(pageId.split("_")[1]);

      document.location = url.resolveScript({
        scriptId: getParameterFromURL("script"),
        deploymentId: getParameterFromURL("deploy"),
        params: {
          start_date: sDateParamValue,
          end_date: eDateParamValue,
          page: pageId,
          tran_type: fieldValue,
        },
      });
    }

    var currentRecord = context.currentRecord;
    var fieldName = context.fieldId;

    if (fieldName == "custpage_transaction_type") {
      var fieldValue = currentRecord.getValue({
        fieldId: fieldName,
      });

      console.log("fieldValue: " + fieldValue);
      tranType = fieldValue;
      debugger;

      var resultURL = url.resolveScript({
        scriptId: getParameterFromURL("script"),
        deploymentId: getParameterFromURL("deploy"),
        params: {
          start_date: sDateParamValue,
          end_date: eDateParamValue,
          page: 0,
          tran_type: fieldValue,
        },
        // returnExternalUrl: boolean
      });

      console.log("resultURL", resultURL);
      log.debug("resultURL: " + resultURL);
      window.location.href = resultURL;
    }
  }

  function markAll() {
    var lineCount = nlapiGetLineItemCount("custpage_record_sublist");
    for (var i = 1; i <= lineCount; i++) {
      nlapiSetLineItemValue(
        "custpage_record_sublist",
        "custpage_select",
        i,
        "T"
      );
    }
  }

  function unmarkAll() {
    var lineCount = nlapiGetLineItemCount("custpage_record_sublist");
    for (var i = 1; i <= lineCount; i++) {
      nlapiSetLineItemValue(
        "custpage_record_sublist",
        "custpage_select",
        i,
        "F"
      );
    }
  }

  function getSuiteletPage(
    suiteletScriptId,
    suiteletDeploymentId,
    transactionType,
    pageId
  ) {
    document.location = url.resolveScript({
      scriptId: suiteletScriptId,
      deploymentId: suiteletDeploymentId,
      params: {
        page: pageId,
        tran_type: transactionType,
      },
    });
  }

  function getParameterFromURL(param) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == param) {
        return decodeURIComponent(pair[1]);
      }
    }
    return false;
  }

  function pageInit(context) {
    currentRecord = context.currentRecord;
    console.log("page Render script calling...");
  }

  function backtoPage() {
    history.back(); // Use JavaScript to go back to the previous page
  }

  function saveRecord(context) {
    debugger;
    var currRecord = context.currentRecord;

    var totalLines = currRecord.getLineCount({
      sublistId: "custpage_record_sublist",
    });

    var isMarked = false;
    for (var i = 0; i < totalLines; i++) {
      var islineMarked = currRecord.getSublistValue({
        sublistId: "custpage_record_sublist",
        fieldId: "custpage_select",
        line: i,
      });

      if (islineMarked){
        isMarked = true;
      }else{
        continue;
      }
    }
    

    if(!isMarked){
      alert("No line has been selected");
      return isMarked; 
    }else{
      return isMarked
    }
  }

  return {
    pageInit: pageInit,
    backtoPage: backtoPage,
    fieldChanged: fieldChanged,
    getSuiteletPage: getSuiteletPage,
    markAll: markAll,
    unmarkAll: unmarkAll,
    saveRecord: saveRecord,
  };
});
