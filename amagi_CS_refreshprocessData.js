/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@author Sagar Kumar
 *@description This will refresh the data and check how many records have been updated and remained in the database.
 */

let currRecord = "";
let isdone = false;
var counter = 0;
var oldStatus = 0;
let isFirstTime = false;
let mainError = false;
let intervalId = 0;
define(["N/search", "N/url"], function (search, url) {
  function pageInit(context) {
    currRecord = context.currentRecord;
    // alert("client script call...");
    var interval = 10000; // 1 minute
    if (!isdone) alert("Records are processing please wait...");
    intervalId = setInterval(checkStatus, interval);
  }

  function checkStatus() {
    let records = 0;
    // Get the URL search parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Retrieve specific parameters by name
    const sDateParamValue = urlParams.get("custscript_adv_start_date"); // Retrieves 'value1'
    const eDateParamValue = urlParams.get("custscript_adv_end_date"); // Retrieves 'value2'

    // console.log("sDateParamValue:", sDateParamValue);
    // console.log("eDateParamValue:", eDateParamValue);

    // Make an AJAX request to the Suitelet

    var suiteletURL = url.resolveScript({
      scriptId: "customscript_show_adv_rem_payment",
      deploymentId: "customdeploy_show_adv_rem_payment",
      params: { start_date: sDateParamValue, end_date: eDateParamValue },
      // returnExternalUrl: true
    });

    // console.log("suiteletURL:", suiteletURL);

    // var suiteletURL =
    //   "/app/site/hosting/scriptlet.nl?script=YOUR_STATUS_CHECK_SUITELET_SCRIPT_ID&deploy=YOUR_STATUS_CHECK_SUITELET_DEPLOYMENT_ID";

    jQuery.ajax({
      url: suiteletURL,
      type: "GET",
      dataType: "json",
      success: function (response) {
        // Process the response (the processing status)
        var status = response.status;

        // Update the UI with the status information (e.g., display it on a field or log it)
        // Example: nlapiSetFieldValue('custpage_status_field', status);
        console.log("Processing Status: " + status);
        console.log("old status: " + oldStatus);
        console.log("is first time: " + isFirstTime);
        console.log("counter " + counter);
        console.log("mainError: " + mainError);

        if (!isFirstTime) {
          oldStatus = status;
          isFirstTime = true;
        }

        if (oldStatus == status) {
          counter++;
        }

        if (counter == 5) {
          mainError = true;
        }

        if (mainError) {
          document.getElementById("proreccssid").innerHTML =
            "<h1>Process failed Please try again...</h1>";
          clearInterval(intervalId);
          throw "Process failed Please try again...";
        } else if (status == 0 && isdone == false) {
          //  var totalRecordsvalue = currRecord.getValue({
          //   fieldId: "custpage_total_records"
          //  });

          //  var empEmail = currRecord.getValue({
          //   fieldId: "custpage_processed_by"
          //  });

          var resultURL = url.resolveScript({
            deploymentId: "customdeploy_payment_result_ui",
            scriptId: "customscript_payment_result_ui",
            params: {
              custscript_adv_start_date: sDateParamValue,
              custscript_adv_end_date: eDateParamValue,
              page: 1,
            },
            // returnExternalUrl: boolean
          });

          isdone = true;

          console.log("resultURL", resultURL);

          window.location.href = resultURL;
        } else {
          document.getElementById("proreccssid").innerHTML =
            status > 0 ? status : 0;
        }
      },
      error: function (error) {
        console.error("Error fetching status: " + JSON.stringify(error));
      },
    });
  }

  function saveRecord(context) {
    var currRecord = context.currentRecord;
    currRecord.getValue({
      fieldId: "",
    });

    currRecord.getValue({
      fieldId: "",
    });
  }

  return {
    pageInit: pageInit,
    saveRecord: saveRecord,
    // validateField: validateField,
    // fieldChanged: fieldChanged,
    // backtoPage: backtoPage,
    // refreshPage: refreshPage,
    // postSourcing: postSourcing,
    // lineInit: lineInit,
    // validateDelete: validateDelete,
    // validateInsert: validateInsert,
    // validateLine: validateLine,
    // sublistChanged: sublistChanged
  };
});
