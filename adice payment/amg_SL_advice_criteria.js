/**
 *@NApiVersion 2.x
 *@NScriptType Suitelet
 */
define(["N/record", "N/search", "N/ui/serverWidget", "N/runtime","N/redirect"], function (
  record,
  search,
  serverWidget,
  runtime,
  redirect
) {
  function onRequest(context) {
    var userId = runtime.getCurrentUser().id;

    if (context.request.method == "GET") {
      var form = serverWidget.createForm({
        title: "Bill Payment Advice",
      });

      form.clientScriptFileId = "474455";

      var startDateField = form.addField({
        id: "custpage_start_date",
        label: "Start Date",
        type: serverWidget.FieldType.DATE,
      });

      var endDateField = form.addField({
        id: "custpage_end_date",
        label: "End Date",
        type: serverWidget.FieldType.DATE,
      });

      form.addSubmitButton({
        label: "Submit",
      });

      context.response.writePage(form);
    } else {
      var startDate = context.request.parameters.custpage_start_date;
      var endDate = context.request.parameters.custpage_end_date;

      log.debug("startDate", startDate);
      log.debug("endDate", endDate);

      redirect.toSuitelet({
        scriptId: "customscript_payment_result_ui",
        deploymentId: "customdeploy_payment_result_ui",
        parameters: { start_date: startDate, end_date: endDate }
      })
      
    }
  }

  return {
    onRequest: onRequest,
  };
});
