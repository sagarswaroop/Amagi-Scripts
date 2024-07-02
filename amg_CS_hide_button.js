/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([], function() {

  function pageInit(context) {
    try {
      
      document.getElementById("_cancel").style.display = "none";
      document.getElementById("secondary_cancel").style.display = "none";
    } catch (error) {
       log.error('Error', error);
       throw new error.message;
    }
  }

  return {
    pageInit: pageInit,
    // saveRecord: saveRecord,
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
