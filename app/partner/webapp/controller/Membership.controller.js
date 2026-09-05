sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, History, Filter, FilterOperator, JSONModel, MessageToast, MessageBox) {
  "use strict";

  var MEMBER_GROUP = "membershipEdit";
  var DIM_GROUP    = "dimUpdate";
  var DESC_GROUP   = "descUpdate";

  return Controller.extend("partner.app.controller.Membership", {

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onInit: function () {
      this.getView().setModel(new JSONModel({
        editMode: false, viewMode: true,
        dimDeleteEnabled:  false,
        descDeleteEnabled: false,
        dimDialogTitle:    "Add Dimension",
        descDialogTitle:   "Add Descriptor",
        dimIdEditable:  true,
        descIdEditable: true
      }), "viewModel");

      this.getOwnerComponent().getRouter()
        .getRoute("membership")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      var oArgs = oEvent.getParameter("arguments");
      this._partnerId    = parseInt(oArgs.partnerId);
      this._membershipId = parseInt(oArgs.membershipId);
      this._validTo      = oArgs.validTo;
      this._dimCtx       = null;
      this._descCtx      = null;
      this._setEditMode(false);

      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/dimDeleteEnabled",  false);
      oVM.setProperty("/descDeleteEnabled", false);

      // Bind membership header
      var sPath = "/PartnerTypes(Partner_Id=" + this._partnerId
                + ",Membership_id="          + this._membershipId
                + ",valid_to="               + this._validTo + ")";
      this.getView().bindElement({
        path: sPath,
        parameters: { $$updateGroupId: MEMBER_GROUP },
        events: {
          bindingChange: function () {
            if (!this.getView().getBindingContext()) {
              MessageBox.error("Membership not found.");
              this.onNavBack();
            }
          }.bind(this)
        }
      });

      // Filter sub-tables
      this._filterTable("dimTable",  "Membership_id", this._membershipId);
      this._filterTable("descTable",
        "Partner_Id eq " + this._partnerId + " and Membership_id eq " + this._membershipId);
    },

    _filterTable: function (sId, sFieldOrExpr, vValue) {
      var sExpr = vValue !== undefined
        ? sFieldOrExpr + " eq " + vValue
        : sFieldOrExpr;                     // already a full expression
      var apply = function () {
        var oBnd = this.byId(sId).getBinding("items");
        if (oBnd) oBnd.changeParameters({ $filter: sExpr });
      }.bind(this);

      var oBnd = this.byId(sId).getBinding("items");
      oBnd ? apply() : this.byId(sId).attachEventOnce("updateFinished", apply);
    },

    _setEditMode: function (bEdit) {
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/editMode", bEdit);
      oVM.setProperty("/viewMode", !bEdit);
    },

    // ── Membership: Edit / Save / Cancel / Delete ─────────────────────────────
    onEditPress:   function () { this._setEditMode(true); },
    onCancelPress: function () {
      this.getView().getModel().resetChanges(MEMBER_GROUP);
      this._setEditMode(false);
    },
    onSavePress: function () {
      this.getView().getModel().submitBatch(MEMBER_GROUP)
        .then(function ()  { MessageToast.show("Membership updated."); this._setEditMode(false); }.bind(this))
        .catch(function (e){ MessageBox.error("Update failed: " + e.message); });
    },
    onDeletePress: function () {
      MessageBox.confirm("Delete this membership?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this.getView().getBindingContext().delete("$auto")
            .then(function ()  { MessageToast.show("Membership deleted."); this.onNavBack(); }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    },
    onNavBack: function () {
      History.getInstance().getPreviousHash() !== undefined
        ? window.history.go(-1)
        : this.getOwnerComponent().getRouter().navTo("detail",
            { partnerId: this._partnerId }, true);
    },

    // ── Dimensions: Read / Query ──────────────────────────────────────────────
    onDimsUpdated: function (oEvent) {
      this.getView().getModel("viewModel")
        .setProperty("/dimCount", oEvent.getParameter("total"));
    },
    onDimSelectionChange: function () {
      this.getView().getModel("viewModel").setProperty(
        "/dimDeleteEnabled",
        this.byId("dimTable").getSelectedItems().length > 0
      );
    },
    onDimSearch: function (oEvent) {
      var sQ = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
      var oBinding = this.byId("dimTable").getBinding("items");
      var sBase = "Membership_id eq " + this._membershipId;
      if (sQ) {
        oBinding.changeParameters({
          $filter: sBase + " and (contains(Dim_id,'" + sQ + "') or contains(Dim_Status,'" + sQ + "'))"
        });
      } else {
        oBinding.changeParameters({ $filter: sBase });
      }
    },

    // ── Dimensions: Create / Update ───────────────────────────────────────────
    onAddDimension: function () {
      this._dimCtx = null;
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/dimDialogTitle", "Add Dimension");
      oVM.setProperty("/dimIdEditable",  true);
      this.byId("dDimId").setSelectedKey("");
      this.byId("dValidTo").setValue("");
      this.byId("dValidFrom").setValue("");
      this.byId("dDimStatus").setSelectedKey("E0001");
      this.byId("dStatusReason").setValue("");
      this.byId("dimDialog").open();
    },
    onEditDimension: function (oEvent) {
      this._dimCtx = oEvent.getSource().getBindingContext();
      var d = this._dimCtx.getObject();
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/dimDialogTitle", "Edit Dimension");
      oVM.setProperty("/dimIdEditable",  false);          // key fields locked
      this.byId("dDimId").setSelectedKey(d.Dim_id        || "");
      this.byId("dValidTo").setValue(d.valid_to          || "");
      this.byId("dValidFrom").setValue(d.Valid_from      || "");
      this.byId("dDimStatus").setSelectedKey(d.Dim_Status || "ACTIV");
      this.byId("dStatusReason").setValue(d.PT_Status_Reason || "");
      this.byId("dimDialog").open();
    },
    onSaveDimension: function () {
      var sDimId = this.byId("dDimId").getSelectedKey();
      var sTo    = this.byId("dValidTo").getValue();
      if (!sDimId) { MessageBox.error("Dimension ID is required."); return; }
      if (!sTo)    { MessageBox.error("Valid To is required."); return; }

      if (this._dimCtx) {
        // Update non-key fields
        var oModel = this.getView().getModel();
        this._dimCtx.setProperty("Valid_from",       this.byId("dValidFrom").getValue());
        this._dimCtx.setProperty("Dim_Status",       this.byId("dDimStatus").getSelectedKey());
        this._dimCtx.setProperty("PT_Status_Reason", this.byId("dStatusReason").getValue().trim());
        oModel.submitBatch(DIM_GROUP)
          .then(function ()  { MessageToast.show("Dimension updated."); this.byId("dimDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Update failed: " + e.message); });
      } else {
        this.byId("dimTable").getBinding("items").create({
          Membership_id:    this._membershipId,
          Dim_id:           sDimId,
          valid_to:         sTo,
          Valid_from:       this.byId("dValidFrom").getValue(),
          Dim_Status:       this.byId("dDimStatus").getSelectedKey(),
          PT_Status_Reason: this.byId("dStatusReason").getValue().trim()
        });
        this.getView().getModel().submitBatch(DIM_GROUP)
          .then(function ()  { MessageToast.show("Dimension created."); this.byId("dimDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Create failed: " + e.message); });
      }
    },
    onCancelDimension: function () { this.byId("dimDialog").close(); },

    // ── Dimensions: Delete ────────────────────────────────────────────────────
    onDeleteDimensions: function () {
      var aItems = this.byId("dimTable").getSelectedItems();
      if (!aItems.length) return;
      MessageBox.confirm("Delete " + aItems.length + " dimension(s)?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          Promise.all(aItems.map(function (i) { return i.getBindingContext().delete("$auto"); }))
            .then(function () {
              MessageToast.show(aItems.length + " dimension(s) deleted.");
              this.getView().getModel("viewModel").setProperty("/dimDeleteEnabled", false);
            }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    },

    // ── Descriptors: Read / Query ─────────────────────────────────────────────
    onDescsUpdated: function (oEvent) {
      this.getView().getModel("viewModel")
        .setProperty("/descCount", oEvent.getParameter("total"));
    },
    onDescSelectionChange: function () {
      this.getView().getModel("viewModel").setProperty(
        "/descDeleteEnabled",
        this.byId("descTable").getSelectedItems().length > 0
      );
    },
    onDescSearch: function (oEvent) {
      var sQ = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
      var oBinding = this.byId("descTable").getBinding("items");
      var sBase = "Partner_Id eq " + this._partnerId + " and Membership_id eq " + this._membershipId;
      if (sQ) {
        oBinding.changeParameters({
          $filter: sBase + " and (contains(Descriptor_ID,'" + sQ + "') or contains(Description,'" + sQ + "'))"
        });
      } else {
        oBinding.changeParameters({ $filter: sBase });
      }
    },

    // ── Descriptors: Create / Update ──────────────────────────────────────────
    onAddDescriptor: function () {
      this._descCtx = null;
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/descDialogTitle", "Add Descriptor");
      oVM.setProperty("/descIdEditable",  true);
      this.byId("dDescId").setSelectedKey("");
      this.byId("dDescValidTo").setValue("");
      this.byId("dDescValidFrom").setValue("");
      this.byId("dDescription").setValue("");
      this.byId("descDialog").open();
    },
    onEditDescriptor: function (oEvent) {
      this._descCtx = oEvent.getSource().getBindingContext();
      var d = this._descCtx.getObject();
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/descDialogTitle", "Edit Descriptor");
      oVM.setProperty("/descIdEditable",  false);         // key fields locked
      this.byId("dDescId").setSelectedKey(d.Descriptor_ID || "");
      this.byId("dDescValidTo").setValue(d.valid_to       || "");
      this.byId("dDescValidFrom").setValue(d.Valid_from   || "");
      this.byId("dDescription").setValue(d.Description   || "");
      this.byId("descDialog").open();
    },
    onSaveDescriptor: function () {
      var sDescId = this.byId("dDescId").getSelectedKey();
      var sTo     = this.byId("dDescValidTo").getValue();
      if (!sDescId) { MessageBox.error("Descriptor ID is required."); return; }
      if (!sTo)     { MessageBox.error("Valid To is required."); return; }

      if (this._descCtx) {
        var oModel = this.getView().getModel();
        this._descCtx.setProperty("Valid_from",   this.byId("dDescValidFrom").getValue());
        this._descCtx.setProperty("Description",  this.byId("dDescription").getValue().trim());
        oModel.submitBatch(DESC_GROUP)
          .then(function ()  { MessageToast.show("Descriptor updated."); this.byId("descDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Update failed: " + e.message); });
      } else {
        this.byId("descTable").getBinding("items").create({
          Descriptor_ID: sDescId,
          Partner_Id:    this._partnerId,
          Membership_id: this._membershipId,
          valid_to:      sTo,
          Valid_from:    this.byId("dDescValidFrom").getValue(),
          Description:   this.byId("dDescription").getValue().trim()
        });
        this.getView().getModel().submitBatch(DESC_GROUP)
          .then(function ()  { MessageToast.show("Descriptor created."); this.byId("descDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Create failed: " + e.message); });
      }
    },
    onCancelDescriptor: function () { this.byId("descDialog").close(); },

    // ── Descriptors: Delete ───────────────────────────────────────────────────
    onDeleteDescriptors: function () {
      var aItems = this.byId("descTable").getSelectedItems();
      if (!aItems.length) return;
      MessageBox.confirm("Delete " + aItems.length + " descriptor(s)?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          Promise.all(aItems.map(function (i) { return i.getBindingContext().delete("$auto"); }))
            .then(function () {
              MessageToast.show(aItems.length + " descriptor(s) deleted.");
              this.getView().getModel("viewModel").setProperty("/descDeleteEnabled", false);
            }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    }
  });
});
