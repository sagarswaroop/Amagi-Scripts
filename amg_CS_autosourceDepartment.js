/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 *@author Sagar Kumar
 *@description: update department at line level for vendor bill when department is not defined on PO but added on item receipt.
 */

define(["N/record"], function (record) {
  function parseURLParams(url) {
    var queryStart = url.indexOf("?") + 1,
      queryEnd = url.indexOf("#") + 1 || url.length + 1,
      query = url.slice(queryStart, queryEnd - 1),
      pairs = query.replace(/\+/g, " ").split("&"),
      parms = {},
      i,
      n,
      v,
      nv;

    if (query === url || query === "") return;

    for (i = 0; i < pairs.length; i++) {
      nv = pairs[i].split("=", 2);
      n = decodeURIComponent(nv[0]);
      v = decodeURIComponent(nv[1]);

      if (!parms.hasOwnProperty(n)) parms[n] = [];
      parms[n].push(nv.length === 2 ? v : null);
    }
    return parms;
  }

  function pageInit(context) {
    //get current url.
    let currentURL = window.location.href;
    let isDepartmentMiss = false;
    const ItemList = [];
    const currRecord = context.currentRecord;

    try {
      debugger;
      // parseURLParams get the parameters and formatted to key value where value will be array.
      log.debug("currentURL",currentURL);
      urlDataObj = parseURLParams(currentURL);

      log.debug("urlDataObj", urlDataObj);

      if (urlDataObj.hasOwnProperty("transform") && urlDataObj.e[0] == "T") {
        let poId = urlDataObj.id[0];
        log.debug("poID", poId);
        if (poId) {
          const PORecord = record.load({
            type: record.Type.PURCHASE_ORDER,
            id: poId,
          });

          let totalLines = PORecord.getLineCount({
            sublistId: "item",
          });

          for (let index = 0; index < totalLines; index++) {
            let lineDepartment = PORecord.getSublistValue({
              sublistId: "item",
              fieldId: "department",
              line: index,
            });

            if (!lineDepartment) {
              isDepartmentMiss = true;
              break;
            } else {
              continue;
            }
          }

          if (isDepartmentMiss) {
            let receiptId = urlDataObj.itemrcpt[0];

            log.debug("receiptId", receiptId);

            if (receiptId) {
              const itemRecord = record.load({
                type: record.Type.ITEM_RECEIPT,
                id: receiptId,
              });

              let totalLiens = itemRecord.getLineCount({
                sublistId: "item",
              });

              for (let index = 0; index < totalLiens; index++) {
                let lineDepartment = itemRecord.getSublistValue({
                  sublistId: "item",
                  fieldId: "department",
                  line: index,
                });

                let obj = {
                  line: index,
                  department: lineDepartment,
                };

                log.debug("list obj", obj);

                //pushing all receipt department with index to update department at line level as per defined index.
                ItemList.push(obj);
              }
            }
          }
        }

        log.debug("ItemList ", ItemList);

        if (ItemList.length > 0) {
          ItemList.forEach((obj) => {
            currRecord.selectLine({
              sublistId: "item",
              line: obj.line,
            });

            currRecord.setCurrentSublistValue({
              sublistId: "item",
              fieldId: "department",
              value: obj.department,
              ignoreFieldChange: false,
            });

            currRecord.commitLine({
              sublistId: "item",
              ignoreRecalc: true,
            });
          });
        }
      }
    } catch (error) {
      log.debug("error during execution of script is", error);
      throw error.message;
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
  };
});
