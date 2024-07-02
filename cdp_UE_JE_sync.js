/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
 define(["N/record", "N/https"], function (record, https) {
    function afterSubmit(context) {
      if(["journalentry", "creditmemo", "customerpayment"].indexOf(context.newRecord.type) === -1) {
        return;
      }
      //log.debug(context.newRecord);
      if(context.newRecord.type == 'invoice'){
            var amountRemaining = context.newRecord.getValue({fieldId: 'amountremaining'});
          record.submitFields({
              type: record.Type.INVOICE,
              id: context.newRecord.id,
              values: {
                  custbody_cdp_amount_due: amountRemaining
              }
          });
      }
      var webHookUrl = 'https://gc5s25anxjeuyys4afq2m2kgqi0pvgod.lambda-url.us-east-1.on.aws/netsuite'
      if(context.newRecord.type == 'journalentry'){
          webHookUrl = 'https://gc5s25anxjeuyys4afq2m2kgqi0pvgod.lambda-url.us-east-1.on.aws/journal'
      }
      var apiResponse = https.post({
        url: webHookUrl,
        headers: {
          name:'Content-Type',
          value:'application/json',
          Authorization: "nng1UKjIjjUa3djIoPrKsegjoAYfZTg3"
        },
        body: JSON.stringify(context.newRecord)
      });
      log.debug('apiResponse',JSON.stringify(apiResponse));
      return apiResponse;
    }
    return {
      afterSubmit: afterSubmit,
    };
  });
  