sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, JSONModel, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("partner.app.controller.List", {

    onInit: function () {
      this.getView().setModel(new JSONModel({
        deleteEnabled: false,
        tableTitle: "Partners"
      }), "viewModel");

      this.getOwnerComponent().getRouter()
        .getRoute("list")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function () {
      var oTable = this.byId("partnerTable");
      if (oTable.getBinding("items")) {
        oTable.getBinding("items").refresh();
      }
    },

    onUpdateFinished: function (oEvent) {
      var iTotal = oEvent.getParameter("total");
      this.getView().getModel("viewModel")
        .setProperty("/tableTitle", "Partners (" + iTotal + ")");
    },

    onSearch: function (oEvent) {
      var sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
      var oBinding = this.byId("partnerTable").getBinding("items");
      var aFilters = sQuery
        ? [new Filter({
            filters: [
              new Filter("Name_org",       FilterOperator.Contains, sQuery),
              new Filter("Country",        FilterOperator.Contains, sQuery),
              new Filter("Partner_status", FilterOperator.Contains, sQuery),
              new Filter("Partner_level",  FilterOperator.Contains, sQuery)
            ],
            and: false
          })]
        : [];
      oBinding.filter(aFilters);
    },

    onSelectionChange: function () {
      var bEnabled = this.byId("partnerTable").getSelectedItems().length > 0;
      this.getView().getModel("viewModel").setProperty("/deleteEnabled", bEnabled);
    },

    // ── Create ────────────────────────────────────────────────────────────────
    onCreatePress: function () {
      this.byId("newName").setValue("");
      this.byId("newCountry").setValue("");
      this.byId("newStatus").setSelectedKey("ACTIV");
      this.byId("newLevel").setValue("");
      this.byId("createDialog").open();
    },

    onSaveCreate: function () {
      var sName = this.byId("newName").getValue().trim();
      if (!sName) {
        MessageBox.error("Organization name is required.");
        return;
      }

      var oListBinding = this.byId("partnerTable").getBinding("items");
      var oContext = oListBinding.create({
        Name_org:       sName,
        Country:        this.byId("newCountry").getValue().trim(),
        Partner_status: this.byId("newStatus").getSelectedKey(),
        Partner_level:  this.byId("newLevel").getValue().trim()
      });

      oContext.created()
        .then(function () {
          MessageToast.show("Partner created successfully.");
          this.byId("createDialog").close();
        }.bind(this))
        .catch(function (oErr) {
          MessageBox.error("Create failed: " + oErr.message);
        });
    },

    onCancelCreate: function () {
      this.byId("createDialog").close();
    },

    // ── Navigate to Detail ────────────────────────────────────────────────────
    onItemPress: function (oEvent) {
      var oContext = oEvent.getSource().getBindingContext
        ? oEvent.getSource().getBindingContext()
        : oEvent.getSource().getParent().getBindingContext();
      this.getOwnerComponent().getRouter().navTo("detail", {
        partnerId: oContext.getProperty("Partner_Id")
      });
    },

    // ── Delete Selected ───────────────────────────────────────────────────────
    onDeleteSelected: function () {
      var aItems = this.byId("partnerTable").getSelectedItems();
      if (!aItems.length) return;

      MessageBox.confirm(
        "Delete " + aItems.length + " selected partner(s)?",
        {
          onClose: function (sAction) {
            if (sAction !== MessageBox.Action.OK) return;
            Promise.all(aItems.map(function (oItem) {
              return oItem.getBindingContext().delete("$auto");
            }))
            .then(function () {
              MessageToast.show(aItems.length + " partner(s) deleted.");
              this.getView().getModel("viewModel").setProperty("/deleteEnabled", false);
            }.bind(this))
            .catch(function (oErr) {
              MessageBox.error("Delete failed: " + oErr.message);
            });
          }.bind(this)
        }
      );
    }
  });
});
