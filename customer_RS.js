/**
 * @NApiVersion 2.x
 * @NScriptType Restlet
 * @NModuleScope SameAccount
 */
define(["N/record", "N/search"], function (record, search) {
  function searchEmployId(employEmail) {
    log.debug("searchEmployId ", employEmail);
    var employeeSearchObj = search.create({
      type: "employee",
      filters: [["email", "is", employEmail], "AND", ["isinactive", "is", "F"]],
      columns: [
        search.createColumn({ name: "entityid" }),
        search.createColumn({ name: "internalid" }),
      ],
    });
    var searchResultCount = employeeSearchObj.runPaged().count;
    log.debug("employeeSearchObj result count", searchResultCount);
    var employId = "";
    employeeSearchObj.run().each(function (result) {
      // .run().each has a limit of 4,000 result
      employId = result.getValue("internalid");

      return true;
    });

    log.debug(employId);

    return employId;
  }

  function doPost(requestBody) {
    var responseData = JSON.parse(
      '{"response": [{"success": [],"error": [] }]}'
    );
    try {
      function searchCurrency(array) {
        //log.debug('array',{'array':array});
        var l = array.length;
        var unique = [];

        for (var ia = 0; ia < l; ia++) {
          for (var j = 0; j < l; j++) {
            if (ia === j) {
              continue;
            }
            if (array[ia] === array[j]) {
              break;
            }
          }
          if (j === l) {
            unique.push(array[ia]);
          }
        }
        //log.debug('unique',{'unique':unique});
        for (var jj = 0; jj < unique.length; jj++) {
          var currId_n = unique[jj];

          var lineNum = customerRecord.selectNewLine({ sublistId: "currency" });
          customerRecord.setCurrentSublistValue({
            sublistId: "currency",
            fieldId: "currency",
            value: currId_n,
          });
          customerRecord.commitLine({ sublistId: "currency" });
        }
      }
      function searchCustomer(amgId) {
        var res = search.create({
          type: "customer",
          columns: ["internalid"],
          filters: [["custentity_fsys_amagicusid_c", "IS", amgId]],
        });
        var resSet = res.run().getRange({ start: 0, end: 100 });
        var plgth = resSet.length;
        if (plgth > 0) {
          var custInternalId = resSet[0].getValue({
            name: "internalid",
            label: "internalid",
          });
          return custInternalId;
        } else {
          return "NEW";
        }
      }
      function searchSubsidiary(sub_nm) {
        var result2 = search.create({
          type: "SUBSIDIARY",
          columns: ["internalid"],
          filters: [["name", "CONTAINS", sub_nm]],
        });
        var resultSet2 = result2.run().getRange({ start: 0, end: 100 });
        var plength2 = resultSet2.length;
        if (plength2 > 0) {
          var subsidiary_ID = resultSet2[0].getValue({
            name: "internalid",
            label: "internalid",
          });
          return subsidiary_ID;
        }
      }
      var data_length = requestBody.data.length;
      for (var i = 0; i < data_length; i++) {
        try {
          var recordId = requestBody.data[i].recordId;
          var amagiId = requestBody.data[i].amagiId;
          var category = requestBody.data[i].category;
          var customerName = requestBody.data[i].customerName;
          var salesRep = searchEmployId(requestBody.data[i].SalesRepEmail);
          //   log.debug('salesRep', salesRep);
          if (salesRep == 0 || salesRep == "" || salesRep == null) {
            throw new Error(
              "The email id is not associate with any sales representative"
            );
          }

          var email = requestBody.data[i].email;
          var webAddress = requestBody.data[i].webAddress;
          var subsidiary = requestBody.data[i].subsidiary;
          var billingCountry = requestBody.data[i].billingCountry;
          var billingStreet = requestBody.data[i].billingStreet;
          var billingCity = requestBody.data[i].billingCity;
          var billingState = requestBody.data[i].billingState;
          var billingZipPostal = requestBody.data[i].billingZipPostal;
          var gstIn_billing = requestBody.data[i].gstIn_billing;
          var gstState_billing = requestBody.data[i].gstState_billing;
          var shippingCountry = requestBody.data[i].shippingCountry;
          var shippingStreet = requestBody.data[i].shippingStreet;
          var shippingCity = requestBody.data[i].shippingCity;
          var shippingState = requestBody.data[i].shippingState;
          var shippingZipPostal = requestBody.data[i].shippingZipPostal;
          var defaultReceivablesAccount =
            requestBody.data[i].defaultReceivablesAccount;
          var region = requestBody.data[i].region;
          var customerSegment = requestBody.data[i].customerSegment;
          var email1 = requestBody.data[i].email1;
          var email2 = requestBody.data[i].email2;
          var email3 = requestBody.data[i].email3;
          var email4 = requestBody.data[i].email4;
          var email5 = requestBody.data[i].email5;
          var email6 = requestBody.data[i].email6;
          var email7 = requestBody.data[i].email7;
          var email8 = requestBody.data[i].email8;
          var ccEmail = requestBody.data[i].ccEmail;
          var paymentTerm = requestBody.data[i].paymentTerm;

          if (subsidiary != "" && amagiId != "") {
            log.debug("amagi id ", amagiId);
            var subsidiaryID = searchSubsidiary(subsidiary);
            var NScustomerID = searchCustomer(amagiId);

            if (NScustomerID == "NEW") {
              var rec_type_st = "created";
              var customerRecord = record.create({
                type: record.Type.CUSTOMER,
                isDynamic: true,
              });

              customerRecord.setValue({ fieldId: "customform", value: 2 });
              customerRecord.setValue({
                fieldId: "custentity_fsys_amagicusid_c",
                value: amagiId,
              });
              customerRecord.setText({ fieldId: "category", text: category });
              customerRecord.setValue({
                fieldId: "companyname",
                value: customerName,
              });
              customerRecord.setValue({ fieldId: "salesrep", value: salesRep });
              customerRecord.setValue({ fieldId: "email", value: email });
              //Dt:26-12-2022, if email exists, then we are enabling allow letters to be emailed checkbox
              if (email) {
                customerRecord.setValue({
                  fieldId: "custentity_3805_dunning_letters_toemail",
                  value: true,
                });
              }
              customerRecord.setValue({ fieldId: "url", value: webAddress });
              customerRecord.setValue({
                fieldId: "subsidiary",
                value: subsidiaryID,
              });
              customerRecord.setText({
                fieldId: "receivablesaccount",
                text: defaultReceivablesAccount,
              });
              customerRecord.setText({ fieldId: "terms", text: paymentTerm });

              if (billingCountry != "") {
                customerRecord.selectNewLine({ sublistId: "addressbook" });
                var addressSubrecord =
                  customerRecord.getCurrentSublistSubrecord({
                    sublistId: "addressbook",
                    fieldId: "addressbookaddress",
                  });

                addressSubrecord.setText({
                  fieldId: "country",
                  text: billingCountry,
                });
                addressSubrecord.setValue({
                  fieldId: "addr1",
                  value: billingStreet,
                });
                addressSubrecord.setValue({
                  fieldId: "city",
                  value: billingCity,
                });
                if (billingCountry == "India") {
                  addressSubrecord.setText({
                    fieldId: "dropdownstate",
                    text: billingState,
                  });
                } else {
                  addressSubrecord.setText({
                    fieldId: "state",
                    text: billingState,
                  });
                }
                addressSubrecord.setValue({
                  fieldId: "zip",
                  value: billingZipPostal,
                });
                addressSubrecord.setValue({
                  fieldId: "custrecord_iit_address_gstn_uid",
                  value: gstIn_billing,
                });
                addressSubrecord.setText({
                  fieldId: "custrecord_iit_address_gst_state",
                  text: gstState_billing,
                });

                customerRecord.commitLine({ sublistId: "addressbook" });
              }

              if (shippingCountry != "") {
                customerRecord.selectNewLine({ sublistId: "addressbook" });
                var addressSubrecord =
                  customerRecord.getCurrentSublistSubrecord({
                    sublistId: "addressbook",
                    fieldId: "addressbookaddress",
                  });

                addressSubrecord.setText({
                  fieldId: "country",
                  text: shippingCountry,
                });
                addressSubrecord.setValue({
                  fieldId: "addr1",
                  value: shippingStreet,
                });
                addressSubrecord.setValue({
                  fieldId: "city",
                  value: shippingCity,
                });
                if (shippingCountry == "India") {
                  addressSubrecord.setText({
                    fieldId: "dropdownstate",
                    text: shippingState,
                  });
                } else {
                  addressSubrecord.setText({
                    fieldId: "state",
                    text: shippingState,
                  });
                }
                addressSubrecord.setValue({
                  fieldId: "zip",
                  value: shippingZipPostal,
                });

                customerRecord.commitLine({ sublistId: "addressbook" });
              }
              // 2-12-2022 : If  Country not equal to india, then set registration type to overseas and autopopulate tax registration sublist field values

              if (billingCountry != "India") {
                customerRecord.setValue({
                  fieldId: "custentity_in_gst_vendor_regist_type",
                  value: "5",
                });

                customerRecord.selectNewLine({ sublistId: "taxregistration" });
                customerRecord.setCurrentSublistText({
                  sublistId: "taxregistration",
                  fieldId: "nexuscountry",
                  text: "India",
                });
                customerRecord.setCurrentSublistText({
                  sublistId: "taxregistration",
                  fieldId: "nexusstate",
                  text: "Other Countries",
                });
                customerRecord.setCurrentSublistValue({
                  sublistId: "taxregistration",
                  fieldId: "nexus",
                  value: "1",
                });
                customerRecord.commitLine({ sublistId: "taxregistration" });
              }

              customerRecord.setText({
                fieldId: "custentity_fsys_region_c",
                text: region,
              });
              customerRecord.setText({
                fieldId: "custentity_fsys_custsegment_c",
                text: customerSegment,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice1",
                value: email1,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice2",
                value: email2,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice3",
                value: email3,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice4",
                value: email4,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice5",
                value: email5,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice6",
                value: email6,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice7",
                value: email7,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice8",
                value: email8,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoicecc",
                value: ccEmail,
              });

              for (var j = 0; j < 5; j++) {
                if (j == 0) {
                  var currId = 1;
                } else if (j == 1) {
                  var currId = 2;
                } else if (j == 2) {
                  var currId = 4;
                } else if (j == 3) {
                  var currId = 5;
                } else if (j == 4) {
                  var currId = 7;
                }
                var lineNum = customerRecord.selectNewLine({
                  sublistId: "currency",
                });
                customerRecord.setCurrentSublistValue({
                  sublistId: "currency",
                  fieldId: "currency",
                  value: currId,
                });
                customerRecord.commitLine({ sublistId: "currency" });
              }
              customerRecord.setValue({ fieldId: "isinactive", value: false });
              var netSuiteCustomerId = customerRecord.save();

              var customerRecord_upt = record.load({
                type: record.Type.CUSTOMER,
                id: netSuiteCustomerId,
              });
              var netsuite_customer_name = customerRecord_upt.getValue({
                fieldId: "entityid",
              });
              var count = customerRecord_upt.getLineCount({
                sublistId: "addressbook",
              });

              for (var i1 = 0; i1 < count; i1++) {
                if (i1 == 0) {
                  if (billingCountry != "") {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: true,
                      line: i1,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: false,
                      line: i1,
                    });
                  }
                  if (shippingCountry != "" && count == 1) {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: true,
                      line: i1,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: false,
                      line: i1,
                    });
                  }
                } else {
                  if (shippingCountry != "") {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: false,
                      line: i1,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: true,
                      line: i1,
                    });
                  }
                }
              }
              var netSuiteCustomerId_upd = customerRecord_upt.save();
            } else {
              var rec_type_st = "updated";

              var customerRecord = record.load({
                type: record.Type.CUSTOMER,
                id: NScustomerID,
                isDynamic: true,
              });

              customerRecord.setValue({ fieldId: "customform", value: 2 });
              customerRecord.setValue({
                fieldId: "custentity_fsys_amagicusid_c",
                value: amagiId,
              });
              customerRecord.setText({ fieldId: "category", text: category });
              customerRecord.setValue({
                fieldId: "companyname",
                value: customerName,
              });
              customerRecord.setValue({ fieldId: "salesrep", value: salesRep });
              customerRecord.setValue({ fieldId: "email", value: email });
              //Dt:26-12-2022, if email exists, then we are enabling allow letters to be emailed checkbox
              if (email) {
                customerRecord.setValue({
                  fieldId: "custentity_3805_dunning_letters_toemail",
                  value: true,
                });
              }
              customerRecord.setValue({ fieldId: "url", value: webAddress });
              customerRecord.setValue({
                fieldId: "subsidiary",
                value: subsidiaryID,
              });
              customerRecord.setText({
                fieldId: "receivablesaccount",
                text: defaultReceivablesAccount,
              });
              customerRecord.setText({ fieldId: "terms", text: paymentTerm });

              var count1 = customerRecord.getLineCount({
                sublistId: "addressbook",
              });

              for (var k = 0; k < count1; k++) {
                customerRecord.removeLine({
                  sublistId: "addressbook",
                  line: 0,
                });
              }

              if (billingCountry != "") {
                customerRecord.selectNewLine({ sublistId: "addressbook" });
                var addressSubrecord =
                  customerRecord.getCurrentSublistSubrecord({
                    sublistId: "addressbook",
                    fieldId: "addressbookaddress",
                  });

                addressSubrecord.setText({
                  fieldId: "country",
                  text: billingCountry,
                });
                addressSubrecord.setValue({
                  fieldId: "addr1",
                  value: billingStreet,
                });
                addressSubrecord.setValue({
                  fieldId: "city",
                  value: billingCity,
                });

                if (billingCountry == "India") {
                  addressSubrecord.setText({
                    fieldId: "dropdownstate",
                    text: billingState,
                  });
                } else {
                  addressSubrecord.setText({
                    fieldId: "state",
                    text: billingState,
                  });
                }

                addressSubrecord.setValue({
                  fieldId: "zip",
                  value: billingZipPostal,
                });
                addressSubrecord.setValue({
                  fieldId: "custrecord_iit_address_gstn_uid",
                  value: gstIn_billing,
                });
                addressSubrecord.setText({
                  fieldId: "custrecord_iit_address_gst_state",
                  text: gstState_billing,
                });
                customerRecord.commitLine({ sublistId: "addressbook" });
              }
              if (shippingCountry != "") {
                customerRecord.selectNewLine({ sublistId: "addressbook" });
                var addressSubrecord =
                  customerRecord.getCurrentSublistSubrecord({
                    sublistId: "addressbook",
                    fieldId: "addressbookaddress",
                  });

                addressSubrecord.setText({
                  fieldId: "country",
                  text: shippingCountry,
                });
                addressSubrecord.setValue({
                  fieldId: "addr1",
                  value: shippingStreet,
                });

                if (shippingCountry == "India") {
                  addressSubrecord.setText({
                    fieldId: "dropdownstate",
                    text: billingState,
                  });
                } else {
                  addressSubrecord.setText({
                    fieldId: "state",
                    text: billingState,
                  });
                }
                addressSubrecord.setValue({
                  fieldId: "city",
                  value: shippingCity,
                });

                addressSubrecord.setValue({
                  fieldId: "zip",
                  value: shippingZipPostal,
                });

                customerRecord.commitLine({ sublistId: "addressbook" });
              }

              customerRecord.setText({
                fieldId: "custentity_fsys_region_c",
                text: region,
              });
              customerRecord.setText({
                fieldId: "custentity_fsys_custsegment_c",
                text: customerSegment,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice1",
                value: email1,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice2",
                value: email2,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice3",
                value: email3,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice4",
                value: email4,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice5",
                value: email5,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice6",
                value: email6,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice7",
                value: email7,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoice8",
                value: email8,
              });
              customerRecord.setValue({
                fieldId: "custentity_emailinvoicecc",
                value: ccEmail,
              });

              var curr_arra = [1, 2, 4, 5, 7];
              var count1_cur = customerRecord.getLineCount({
                sublistId: "currency",
              });
              for (var cj = 0; cj < count1_cur; cj++) {
                var curr_nm = parseInt(
                  customerRecord.getSublistValue({
                    sublistId: "currency",
                    fieldId: "currency",
                    line: cj,
                  })
                );

                //log.debug('old_curr',{'curr_nm':curr_nm});
                curr_arra.push(curr_nm);
              }
              //log.debug('curr_arra',{'curr_arra':curr_arra});
              var newCurr = searchCurrency(curr_arra);

              customerRecord.setValue({ fieldId: "isinactive", value: false });
              var netSuiteCustomerId = customerRecord.save();

              var customerRecord_upt = record.load({
                type: record.Type.CUSTOMER,
                id: netSuiteCustomerId,
              });
              var netsuite_customer_name = customerRecord_upt.getValue({
                fieldId: "entityid",
              });
              var count = customerRecord_upt.getLineCount({
                sublistId: "addressbook",
              });

              for (var i2 = 0; i2 < count; i2++) {
                if (i2 == 0) {
                  if (billingCountry != "") {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: true,
                      line: i2,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: false,
                      line: i2,
                    });
                  }
                  if (shippingCountry != "" && count == 1) {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: true,
                      line: i2,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: false,
                      line: i2,
                    });
                  }
                } else {
                  if (shippingCountry != "") {
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultbilling",
                      value: false,
                      line: i2,
                    });
                    customerRecord_upt.setSublistValue({
                      sublistId: "addressbook",
                      fieldId: "defaultshipping",
                      value: true,
                      line: i2,
                    });
                  }
                }
              }
              var netSuiteCustomerId_upd = customerRecord_upt.save();
            }
            var NS_num_arr = netsuite_customer_name.split(" ");
            var NS_num = NS_num_arr[0];

            log.debug("result", {
              type: rec_type_st,
              recordId: recordId,
              amagiCustomerId: amagiId,
              customerName: customerName,
              netSuiteId: NS_num,
              "netsuite internal id": netSuiteCustomerId_upd,
            });
            responseData.response[0].success.push({
              type: rec_type_st,
              recordId: recordId,
              amagiCustomerId: amagiId,
              customerName: customerName,
              netSuiteId: NS_num,
            });
          } else {
            if (amagiId == "") {
              var error_msg = "Please enter the value for amagi Id";
            } else if (subsidiary == "") {
              var error_msg = "Please enter the value for Subsidiary";
            }
            log.debug("Custom Error Message", {
              amagiCustomerId: amagiId,
              message: error_msg,
            });
            responseData.response[0].error.push({
              recordId: recordId,
              amagiCustomerId: amagiId,
              errorDetail: { name: "INVALID_FLD_VALUE", message: error_msg },
            });
          }
        } catch (exeception) {
          log.debug("error", { exeception: exeception });
          responseData.response[0].error.push({
            amagiCustomerId: amagiId,
            recordId: recordId,
            customerName: customerName,
            type: rec_type_st,
            errorDetail: exeception,
          });
        }
      }
    } catch (e) {
      responseData.response[0].error.push({
        amagiCustomerId: "",
        customerName: "",
        type: "",
        errorDetail: e,
      });
      log.debug("error", { e: e });
    }

    return responseData;
  }

  function doGet(request) {
    return {
      message: "success",
    };
  }

  return {
    post: doPost,
    get: doGet,
  };
});
