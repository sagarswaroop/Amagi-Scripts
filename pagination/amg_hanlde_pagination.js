/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */

var tranType = "payments";
define(["N/url"], function (url) {
  function fieldChanged(context) {
    const urlParams = new URLSearchParams(window.location.search);
    // Navigate to selected page
    debugger;
    if (context.fieldId == "custpage_pageid") {
      var pageId = context.currentRecord.getValue({
        fieldId: "custpage_pageid",
      });
      
      const type = urlParams.get("tran_type");

      if(type){
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
          page: pageId,
          tran_type: tranType
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


      // Retrieve specific parameters by name
      const sDateParamValue = urlParams.get("custscript_adv_start_date"); // Retrieves 'value1'
      const eDateParamValue = urlParams.get("custscript_adv_end_date"); // Retrieves 'value2'
      var resultURL = url.resolveScript({
        deploymentId: "customdeploy_payment_result_ui",
        scriptId: "customscript_payment_result_ui",
        params: {
          custscript_adv_start_date: sDateParamValue,
          custscript_adv_end_date: eDateParamValue,
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

  function getSuiteletPage(suiteletScriptId, suiteletDeploymentId, transactionType, pageId) {
    document.location = url.resolveScript({
      scriptId: suiteletScriptId,
      deploymentId: suiteletDeploymentId,
      params: {
        page: pageId,
        tran_type: transactionType
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
    console.log("page Render script calling...");
  }

  function backtoPage() {
    history.back(); // Use JavaScript to go back to the previous page
  }

  return {
    pageInit: pageInit,
    backtoPage: backtoPage,
    fieldChanged: fieldChanged,
    getSuiteletPage: getSuiteletPage,
  };
});
