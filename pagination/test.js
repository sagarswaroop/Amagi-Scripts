require(['N'], function(N) {
    for(var n in N){window[n] = N[n];};
    try{
        
        var searchObj = search.create({
            type: "journalentry",
            filters: [
              ["custbody_payment_advice_flag", "is", "F"],
              "AND",
              ["type", "anyof", "Journal"],
              "AND",
              ["line", "equalto", "0"],
              "AND",
              // ["trandate", "within", startDate, endDate],
              ["trandate", "within", "09/9/2023", "09/10/2023"],
              "AND",
              [
                ["systemnotes.context", "anyof", "SCH"],
                "AND",
                ["systemnotes.newvalue", "is", "T"],
                "AND",
                ["systemnotes.date", "within", "today"],
              ],
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
      
        //   return searchObj.runPaged({
        //     pageSize: 50,
        //   });

    console.log("theData",searchObj.runPaged({
        pageSize: 50,
      }).count);
    
    } catch(e){console.error(e.message);}})