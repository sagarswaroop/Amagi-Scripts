/**
 *@NApiVersion 2.1
 *@NScriptType MassUpdateScript
 */
define(["N/record"], function(record) {

    function each(params) {
        record.submitFields({
            type: record.Type.VENDOR_PAYMENT,
            id: params.id,
            values: {"custbody_payment_advice_flag": false}
        })
    }

    return {
        each: each
    }
});
