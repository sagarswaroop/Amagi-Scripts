/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */

var PAGE_SIZE = 50;
var SEARCH_ID = "customsearch225";
var CLIENT_SCRIPT_FILE_ID = 472850;

define(["N/ui/serverWidget", "N/search", "N/redirect"], function (
  serverWidget,
  search,
  redirect
) {
  function onRequest(context) {
    if (context.request.method == "GET") {
      // Get parameters
      var pageId = parseInt(context.request.parameters.page);
      var scriptId = context.request.parameters.script;
      var deploymentId = context.request.parameters.deploy;
      var startDate = context.request.parameters.end_date;
      var endDate = context.request.parameters.start_date;

      log.debug("startDate", startDate);
      log.debug("endDate", endDate);

      // Create a form
      var form = serverWidget.createForm({
        title: "Bill Payment Result",
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

      startDateField.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

      endDateField.updateDisplayType({
        displayType: serverWidget.FieldDisplayType.DISABLED,
      });

      startDateField.defaultValue = startDate;
      endDateField.defaultValue = endDate;
/**          PAYMEBT SUSBLIST   CODE: START                    */

      // Add PAYMENT SUSBLIST to display records
      var sublist = form.addSublist({
        id: "custpage_record_sublist",
        type: serverWidget.SublistType.LIST,
        label: "Bill Payment",
      });

      // Define columns for the sublist
      sublist
        .addField({
          id: "internalid",
          type: serverWidget.FieldType.TEXT,
          label: "Id",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "type",
          type: serverWidget.FieldType.TEXT,
          label: "Type",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "datecreated",
          type: serverWidget.FieldType.TEXT,
          label: "Date",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "entity",
          type: serverWidget.FieldType.TEXT,
          label: "Vendor",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "amount",
          type: serverWidget.FieldType.CURRENCY,
          label: "Amount",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "subsidiary",
          type: serverWidget.FieldType.TEXT,
          label: "Subsidiary",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

      sublist
        .addField({
          id: "custbody_payment_advice_flag",
          type: serverWidget.FieldType.CHECKBOX,
          label: "Payment Advice Flag",
        })
        .updateDisplayType({
          displayType: serverWidget.FieldDisplayType.DISABLED,
        });

/**           PAYMENT SUBLIST CODE: END */

      // Run search and determine page count
      var retrieveSearch = runSearch(SEARCH_ID, PAGE_SIZE, startDate, endDate);
      var pageCount = Math.ceil(retrieveSearch.count / PAGE_SIZE);

      // Set pageId to correct value if out of index
      if (!pageId || pageId == "" || pageId < 0) pageId = 0;
      else if (pageId >= pageCount) pageId = pageCount - 1;

      // Add buttons to simulate Next & Previous
      if (pageId != 0) {
        sublist.addButton({
          id: "custpage_previous",
          label: "Previous",
          functionName:
            "getSuiteletPage(" +
            scriptId +
            ", " +
            deploymentId +
            ", " +
            (pageId - 1) +
            ")",
        });
      }

      if (pageId != pageCount - 1) {
        sublist.addButton({
          id: "custpage_next",
          label: "Next",
          functionName:
            "getSuiteletPage(" +
            scriptId +
            ", " +
            deploymentId +
            ", " +
            (pageId + 1) +
            ")",
        });
      }

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
      var addResults = fetchSearchResult(retrieveSearch, pageId);

      // Set data returned to columns

      addResults.forEach(function (result, j) {
        for (var fieldKey in result) {
          if (result.hasOwnProperty.call(result, fieldKey)) {
            var fieldValue = result[fieldKey];

            sublist.setSublistValue({
              id: fieldKey,
              line: j,
              value: fieldValue,
            });
          }
        }
      });

      context.response.writePage(form);
    }
  }

  return {
    onRequest: onRequest,
  };

  function runSearch(searchId, searchPageSize, startDate, endDate) {
    var searchObj = search.create({
      type: "vendorpayment",
      filters: [
        ["custbody_payment_advice_flag", "is", "T"],
        "AND",
        ["type", "anyof", "VendPymt"],
        "AND",
        ["mainline", "is", "T"],
        "AND",
        ["trandate", "within", startDate, endDate],
        "AND",
        [["systemnotes.context","anyof","SCH"],"AND",["systemnotes.newvalue","is","T"],"AND",["systemnotes.date","within","today"]]

      ],
      columns: [
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
      ],
    });

    log.debug("searchObj", JSON.stringify(searchObj));

    return searchObj.runPaged({
      pageSize: searchPageSize,
    });
  }

  function fetchSearchResult(pagedData, pageIndex) {
    var searchPage = pagedData.fetch({
      index: pageIndex,
    });

    var results = new Array();

    searchPage.data.forEach(function (result) {
      //   var lineData = [];
      var internalId = result.id;
      result.getValue({ name: "type" });
      result.getValue({ name: "datecreated" });
      result.getText({ name: "entity" });
      result.getValue({ name: "amount" });
      result.getText({ name: "subsidiary" });

      results.push({
        internalid: result.getValue({ name: "internalid" }),
        type: result.getValue({ name: "type" }),
        datecreated: result.getValue({ name: "datecreated" }),
        entity: result.getText({ name: "entity" }),
        amount: result.getValue({ name: "amount" }),
        subsidiary: result.getText({ name: "subsidiary" }),
        custbody_payment_advice_flag: 'T'

      });
    });
    return results;
  }

  function convertDate(inputFormat) {
    function pad(s) { return (s < 10) ? '0' + s : s; }
    var d = new Date(inputFormat)
    return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('/')
}

});
