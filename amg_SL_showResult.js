/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

define(["N/record", "N/search"], function (record, search) {
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
          ["line", "equalto", "0"],
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
      // Your logic to check the processing status of records here
      var startDate = context.request.parameters.start_date;
      var endDate = context.request.parameters.end_date;

      log.debug("startDate : " + startDate, "endDate: " + endDate);
      // var status = checkProcessingStatus(startDate,endDate);

      var billPaymentResult = getBillPaymentInfo(startDate, endDate);

      log.debug("billPaymentResult : " + billPaymentResult);

      var journalEntryResult = getJournalEntryInfo(startDate, endDate);

      log.debug("journalEntryResult : " + journalEntryResult);

      var status = parseInt(journalEntryResult) + parseInt(billPaymentResult);

      // Respond with the status as JSON
      context.response.write(JSON.stringify({ status: status }));
    }
  }

  return {
    onRequest: onRequest,
  };
});
