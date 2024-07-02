/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 100;
var SEARCH_ID = "customsearch225";
var CLIENT_SCRIPT_FILE_ID = 472850;

define(["N/ui/serverWidget", "N/search", "N/redirect", "N/runtime","N/task"], function (
  serverWidget,
  search,
  redirect,
  runtime,
  task
) {
  function _logValidation(value) {
    if (value != null && value != "" && value != undefined) return true;
    else return false;
  }

  function onRequest(context) {
    if (context.request.method == "GET") {
      // Get parameters
      var pageId = parseInt(context.request.parameters.page);
      var scriptId = context.request.parameters.script;
      var deploymentId = context.request.parameters.deploy;
      var startDate = context.request.parameters.start_date;
      var endDate = context.request.parameters.end_date;
      var transactionType = context.request.parameters.tran_type || "payments";

      if (transactionType != "payments") {
        transactionType = "Journal_entries";
      }

      log.debug("startDate", startDate);
      log.debug("endDate", endDate);
      log.debug("transactionType", transactionType);

      // Create a form
      var form = serverWidget.createForm({
        title: "Advice Payment Result",
      });

      form.clientScriptFileId = CLIENT_SCRIPT_FILE_ID;

      var startDateField = form.addField({
        id: "custpage_start_date",
        label: "Start Date",
        type: serverWidget.FieldType.TEXT,
      });

      var endDateField = form.addField({
        id: "custpage_end_date",
        label: "End Date",
        type: serverWidget.FieldType.TEXT,
      });

      var transactionTypeField = form.addField({
        id: "custpage_transaction_type",
        label: "Show Transaction Type",
        type: serverWidget.FieldType.SELECT,
      });

      form.addSubmitButton({
        label: "Submit",
      });

      form.addButton({
        id: "custpage_back_button",
        label: "Return",
        functionName: "backtoPage()"
      })

      transactionTypeField.addSelectOption({
        value: "payments",
        text: "Payments",
        isSelected: true,
      });

      transactionTypeField.addSelectOption({
        value: "Journal_entries",
        text: "Journal Entries",
        isSelected: true,
      });

      startDateField.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

      endDateField.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

      startDateField.defaultValue = startDate;
      endDateField.defaultValue = endDate;
      transactionTypeField.defaultValue = transactionType;

      ////////////////////////////////////////// ADD SUB-LIST TO THE FORM CODE: START //////////////////////////////////////////////////////
      // Add  Bill sublit to the form.
      var paymentSublist = form.addSublist({
        id: "custpage_record_sublist",
        type: serverWidget.SublistType.LIST,
        label: "Results",
      });

      paymentSublist.addButton({
        id: "custpage_markall_btn",
        label: "Mark All",
        functionName: "markAll()",
      });

      paymentSublist.addButton({
        id: "custpage_unmarkall_btn",
        label: "Unmark All",
        functionName: "unmarkAll()",
      });

      // Define columns for the sublist

      paymentSublist
        .addField({
          id: "custpage_select",
          type: serverWidget.FieldType.CHECKBOX,
          label: "Mark",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.NORMAL,
        });

      paymentSublist
        .addField({
          id: "internalid",
          type: serverWidget.FieldType.TEXT,
          label: "Id",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      paymentSublist
        .addField({
          id: "type",
          type: serverWidget.FieldType.TEXT,
          label: "Type",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      paymentSublist
        .addField({
          id: "datecreated",
          type: serverWidget.FieldType.TEXT,
          label: "Date",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      paymentSublist
        .addField({
          id: "entity",
          type: serverWidget.FieldType.TEXT,
          label: "Vendor",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      paymentSublist
        .addField({
          id: "amount",
          type: serverWidget.FieldType.CURRENCY,
          label: "Amount",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      paymentSublist
        .addField({
          id: "subsidiary",
          type: serverWidget.FieldType.TEXT,
          label: "Subsidiary",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      // if(transactionType == "payments" || transactionType == "Journal_entries"){
      paymentSublist
        .addField({
          id: "custbody_payment_advice_flag",
          type: serverWidget.FieldType.CHECKBOX,
          label: "Payment Advice Flag",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      ////////////////////////////////////////// ADD SUB-LIST TO THE FORM CODE: END //////////////////////////////////////////////////////

      //////////////////////////// SEARCH DATA  AND ADD (NEXT, PREVIOUS) BUTTON BY THE TOTAL PAGE COUNT OF SEARCHED DATA - CODE : START ///////////////////////////////////

      // Run search and determine page count for payment advice
      if (transactionType == "payments" || transactionType == "Journal_entries")
        var retrieveSearch = runSearch(
          transactionType,
          PAGE_SIZE,
          startDate,
          endDate
        );
      var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

      // Set pageId to correct value if out of index
      if (!pageId || pageId == "" || pageId < 0) pageId = 0;
      else if (pageId >= pageCount) pageId = pageCount - 1;

      // Add buttons to simulate Next & Previous
      // Add buttons to simulate Next & Previous for payment Advice

      //////////////////////////// SEARCH DATA AND ADD (NEXT, PREVIOUS) BUTTON BY THE TOTAL PAGE COUNT OF SEARCHED DATA - CODE : END ///////////////////////////////////

      ////////////////////////////////////////////////// SET SUB-LIST VALUE Code: START ///////////////////////////////////////////////

      // Add drop-down and options to navigate to specific page
      var selectOptions = form.addField({
        id: "custpage_pageid",
        label: "Page Index",
        type: serverWidget.FieldType.SELECT,
      });

      for (i = 0; i < pageCount; i++) {
        if (i == pageId) {
          selectOptions.addSelectOption({
            value: "pageid_" + i,
            text: i * PAGE_SIZE + 1 + " - " + (i + 1) * PAGE_SIZE,
            isSelected: true,
          });
        } else {
          selectOptions.addSelectOption({
            value: "pageid_" + i,
            text: i * PAGE_SIZE + 1 + " - " + (i + 1) * PAGE_SIZE,
          });
        }
      }

      // Get subset of data to be shown on page
      if (retrieveSearch.count > 0) {
        var addResults = fetchSearchResult(retrieveSearch, pageId);
        // log.debug("Add results", addResults);
        addResults.forEach(function (result, j) {
          for (var fieldKey in result) {
            if (result.hasOwnProperty.call(result, fieldKey)) {
              var fieldValue = result[fieldKey];

              paymentSublist.setSublistValue({
                id: fieldKey,
                line: j,
                value: fieldValue,
              });
            }
          }
        });
      }

      ////////////////////////////////////////////////// SET SUB-LIST VALUE Code: END ///////////////////////////////////////////////

      context.response.writePage(form);
    } else {
      var userId = runtime.getCurrentUser().id;
      var serverRequest = context.request;
      var idsArr = '';
      var totalRecords = 0;

      var totalLines = serverRequest.getLineCount({
        group: "custpage_record_sublist",
      });

      for (var index = 0; index < totalLines; index++) {
        var isSelected = serverRequest.getSublistValue({
          group: "custpage_record_sublist",
          line: index,
          name: "custpage_select",
        });

        log.debug("isSelected", isSelected);

        if (isSelected == 'T') {
          var internalId = serverRequest.getSublistValue({
            group: "custpage_record_sublist",
            line: index,
            name: "internalid",
          });

          var recType = serverRequest.getSublistValue({
            group: "custpage_record_sublist",
            line: index,
            name: "type",
          });

          if (_logValidation(internalId) && _logValidation(recType))
          idsArr += recType + "_" + internalId + ",";

          totalRecords++;
        }
      }
     
      if (_logValidation(idsArr)) idsArr = idsArr.slice(0, -1);

      log.debug("idsArr", idsArr);
      log.debug("userId", userId);

      // log.debug("PaymentAdviceResult "+ a_params.length, a_params);

      var mrTask = task.create({
        taskType: task.TaskType.MAP_REDUCE,
        scriptId: "customscript_mr_send_pdf",
        deploymentId: 'customdeploy_mr_send_pdf',
        params: {
          "custscript_data_to_process" : JSON.stringify(idsArr),
          "custscript_current_userid" : userId
        }
      });

      log.debug("mrtask", mrTask);
      
      var takId = mrTask.submit();

      log.debug("takId", takId);

      var form = serverWidget.createForm({
        title: "Script called",
      });

      var form = serverWidget.createForm({
        title: "Payment Advice Summary",
      });

      var htmlData = form.addField({
        id: "custpage_show_html",
        type: serverWidget.FieldType.INLINEHTML,
        label: "inline html",
      });

      htmlData.defaultValue =
        "<h4>Greetings from NetSuite!</br>Thank you for using the Payment Advice Process. The Process is Initiated.</br> Total records are "+ totalRecords+"</h4>";

      context.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };

  function runSearch(transactionType, searchPageSize, startDate, endDate) {
    var searchFilter = new Array();
    var searchType = "";
    var columns = [];
    var searchType = "";

    if (transactionType == "Journal_entries") {
      searchType = "journalentry";
      searchFilter = [
        ["custbody_payment_advice_flag", "is", "F"],
        "AND",
        ["type", "anyof", "Journal"],
        "AND",
        ["line", "equalto", "0"],
        "AND",
        ["accounttype", "anyof", "AcctPay"],
        "AND",
        ["applyingtransaction.type", "anyof", "VendPymt"],
        "AND",
        ["applyingtransaction.voided", "is", "F"],
        "AND",
        ["trandate", "within", startDate, endDate],
        // ["trandate", "within", "09/9/2023", "09/11/2023"],
      ];
      columns = [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "type", label: "Type" }),
        search.createColumn({ name: "datecreated", label: "Date Created" }),
        search.createColumn({ name: "entity", label: "Name" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
        search.createColumn({
          name: "custbody_payment_advice_flag",
          label: "Payment Advice Flag",
        }),
      ];
    } else if (transactionType == "payments") {
      searchType = "vendorpayment";
      searchFilter = [
        ["custbody_payment_advice_flag", "is", "F"],
        "AND",
        ["type", "anyof", "VendPymt"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["trandate", "within", startDate, endDate],
        "AND",
        ["voided", "is", "F"],
      ];
    }

    var searchObj = search.create({
      type: searchType,
      filters: searchFilter,
      columns: (columns = [
        search.createColumn({ name: "internalid", label: "Internal ID" }),
        search.createColumn({ name: "type", label: "Type" }),
        search.createColumn({ name: "datecreated", label: "Date Created" }),
        search.createColumn({ name: "entity", label: "Name" }),
        search.createColumn({ name: "amount", label: "Amount" }),
        search.createColumn({ name: "subsidiary", label: "Subsidiary" }),
        search.createColumn({
          name: "custbody_payment_advice_flag",
          label: "Payment Advice Flag",
        }),
      ]),
    });

    // log.debug("searchObj", JSON.stringify(searchObj));

    return searchObj.runPaged({
      pageSize: searchPageSize,
    });
  }

  function fetchSearchResult(pagedData, pageIndex) {
    var searchPage = pagedData.fetch({
      index: pageIndex,
    });

    var results = [];

    searchPage.data.forEach(function (result) {
      results.push({
        internalid: result.getValue({ name: "internalid" }) || "",
        type: result.getValue({ name: "type" }),
        datecreated: result.getValue({ name: "datecreated" }) || "",
        entity: result.getText({ name: "entity" }),
        amount: Math.abs(result.getValue({ name: "amount" })) || "",
        subsidiary: result.getText({ name: "subsidiary" }) || "",
        custbody_payment_advice_flag: result.getValue({ name: "custbody_payment_advice_flag" }) || "F",
      });
    });

    // log.debug("results", results);

    return results;
  }

  function convertDate(inputFormat) {
    function pad(s) {
      return s < 10 ? "0" + s : s;
    }
    var d = new Date(inputFormat);
    return [pad(d.getDate()), pad(d.getMonth() + 1), d.getFullYear()].join("/");
  }
});
