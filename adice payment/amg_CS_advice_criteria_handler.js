/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], function() {

    function pageInit(context) {
        
    }

    function saveRecord(context) {
        const currRecord = context.currentRecord;
        let startDate = currRecord.getValue({
            fieldId: "custpage_start_date"
        });

        let endDate = currRecord.getValue({
            fieldId: "custpage_end_date"
        });

        if(startDate > endDate){
            alert('Start date should not be greater than End date.');
            return false
        }else{
            return true;
        }
    }

    function validateField(context) {
        
    }

    function fieldChanged(context) {
        
    }

    function postSourcing(context) {
        
    }

    function lineInit(context) {
        
    }

    function validateDelete(context) {
        
    }

    function validateInsert(context) {
        
    }

    function validateLine(context) {
        
    }

    function sublistChanged(context) {
        
    }

    return {
        // pageInit: pageInit,
        saveRecord: saveRecord,
        // validateField: validateField,
        // fieldChanged: fieldChanged,
        // postSourcing: postSourcing,
        // lineInit: lineInit,
        // validateDelete: validateDelete,
        // validateInsert: validateInsert,
        // validateLine: validateLine,
        // sublistChanged: sublistChanged
    }
});
