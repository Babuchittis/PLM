sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/core/routing/History",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function (Controller, History, JSONModel, MessageToast, MessageBox) {
  "use strict";

  var PARTNER_GROUP  = "partnerDetail";
  var CONTACT_GROUP  = "contactUpdate";

  return Controller.extend("partner.app.controller.Detail", {

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    onInit: function () {
      this.getView().setModel(new JSONModel({
        editMode: false, viewMode: true,
        contactDeleteEnabled: false,
        membershipDeleteEnabled: false,
        contactDialogTitle: "Add Contact"
      }), "viewModel");

      this.getOwnerComponent().getRouter()
        .getRoute("detail")
        .attachPatternMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function (oEvent) {
      this._partnerId = parseInt(oEvent.getParameter("arguments").partnerId);
      this._contactCtx = null;
      this._memberCtx  = null;
      this._setEditMode(false);

      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/contactDeleteEnabled",   false);
      oVM.setProperty("/membershipDeleteEnabled", false);

      // Bind partner header form
      this.getView().bindElement({
        path: "/Partner(" + this._partnerId + ")",
        parameters: { $$updateGroupId: PARTNER_GROUP },
        events: {
          bindingChange: function () {
            if (!this.getView().getBindingContext()) {
              MessageBox.error("Partner not found.");
              this.onNavBack();
            }
          }.bind(this)
        }
      });

      // Filter sub-tables to this partner
      this._filterTable("contactsTable",   this._partnerId);
      this._filterTable("membershipTable", this._partnerId);
    },

    _filterTable: function (sId, iPartnerId) {
      var sFilter = "Partner_Id eq " + iPartnerId;
      var oBinding = this.byId(sId).getBinding("items");
      if (oBinding) {
        oBinding.changeParameters({ $filter: sFilter });
      } else {
        this.byId(sId).attachEventOnce("updateFinished", function () {
          var oBnd = this.byId(sId).getBinding("items");
          if (oBnd) oBnd.changeParameters({ $filter: sFilter });
        }.bind(this));
      }
    },

    _setEditMode: function (bEdit) {
      var oVM = this.getView().getModel("viewModel");
      oVM.setProperty("/editMode", bEdit);
      oVM.setProperty("/viewMode", !bEdit);
    },

    // ── Partner: Edit / Save / Cancel / Delete ────────────────────────────────
    onEditPress:   function () { this._setEditMode(true); },
    onCancelPress: function () {
      this.getView().getModel().resetChanges(PARTNER_GROUP);
      this._setEditMode(false);
    },
    onSavePress: function () {
      this.getView().getModel().submitBatch(PARTNER_GROUP)
        .then(function ()  { MessageToast.show("Partner updated."); this._setEditMode(false); }.bind(this))
        .catch(function (e){ MessageBox.error("Update failed: " + e.message); });
    },
    onDeletePress: function () {
      MessageBox.confirm("Delete this partner?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          this.getView().getBindingContext().delete("$auto")
            .then(function ()  { MessageToast.show("Partner deleted."); this.onNavBack(); }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    },
    onNavBack: function () {
      History.getInstance().getPreviousHash() !== undefined
        ? window.history.go(-1)
        : this.getOwnerComponent().getRouter().navTo("list", {}, true);
    },

    // ── Contacts: CRUD ────────────────────────────────────────────────────────
    onContactsUpdated: function (oEvent) {
      this.getView().getModel("viewModel")
        .setProperty("/contactCount", oEvent.getParameter("total"));
    },
    onContactSelectionChange: function () {
      this.getView().getModel("viewModel").setProperty(
        "/contactDeleteEnabled",
        this.byId("contactsTable").getSelectedItems().length > 0
      );
    },

    onAddContact: function () {
      this._contactCtx = null;
      this.getView().getModel("viewModel").setProperty("/contactDialogTitle", "Add Contact");
      this._ids(["cFirst","cLast","cEmail","cFunction","cDept","cLang"]).forEach(function (o) { o.setValue(""); });
      this.byId("contactDialog").open();
    },
    onEditContact: function (oEvent) {
      this._contactCtx = oEvent.getSource().getBindingContext();
      var d = this._contactCtx.getObject();
      this.getView().getModel("viewModel").setProperty("/contactDialogTitle", "Edit Contact");
      this.byId("cFirst").setValue(d.First_Name   || "");
      this.byId("cLast").setValue(d.Last_Name     || "");
      this.byId("cEmail").setValue(d.Email        || "");
      this.byId("cFunction").setValue(d.Function  || "");
      this.byId("cDept").setValue(d.Department    || "");
      this.byId("cLang").setValue(d.Comm_lang     || "");
      this.byId("contactDialog").open();
    },
    onSaveContact: function () {
      var sFirst = this.byId("cFirst").getValue().trim();
      if (!sFirst) { MessageBox.error("First name is required."); return; }

      if (this._contactCtx) {
        // ── Update (patch non-key fields only)
        var oModel = this.getView().getModel();
        this._contactCtx.setProperty("First_Name",  sFirst);
        this._contactCtx.setProperty("Last_Name",   this.byId("cLast").getValue().trim());
        this._contactCtx.setProperty("Email",       this.byId("cEmail").getValue().trim());
        this._contactCtx.setProperty("Function",    this.byId("cFunction").getValue().trim());
        this._contactCtx.setProperty("Department",  this.byId("cDept").getValue().trim());
        this._contactCtx.setProperty("Comm_lang",   this.byId("cLang").getValue().trim());
        oModel.submitBatch(CONTACT_GROUP)
          .then(function ()  { MessageToast.show("Contact updated."); this.byId("contactDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Update failed: " + e.message); });
      } else {
        // ── Create
        this.byId("contactsTable").getBinding("items").create({
          Partner_Id:  this._partnerId,
          First_Name:  sFirst,
          Last_Name:   this.byId("cLast").getValue().trim(),
          Email:       this.byId("cEmail").getValue().trim(),
          Function:    this.byId("cFunction").getValue().trim(),
          Department:  this.byId("cDept").getValue().trim(),
          Comm_lang:   this.byId("cLang").getValue().trim()
        });
        this.getView().getModel().submitBatch(CONTACT_GROUP)
          .then(function ()  { MessageToast.show("Contact created."); this.byId("contactDialog").close(); }.bind(this))
          .catch(function (e){ MessageBox.error("Create failed: " + e.message); });
      }
    },
    onCancelContact: function () { this.byId("contactDialog").close(); },

    onDeleteContacts: function () {
      var aItems = this.byId("contactsTable").getSelectedItems();
      if (!aItems.length) return;
      MessageBox.confirm("Delete " + aItems.length + " contact(s)?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          Promise.all(aItems.map(function (i) { return i.getBindingContext().delete("$auto"); }))
            .then(function () {
              MessageToast.show(aItems.length + " contact(s) deleted.");
              this.getView().getModel("viewModel").setProperty("/contactDeleteEnabled", false);
            }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    },

    // ── Memberships: CRUD ─────────────────────────────────────────────────────
    onMembershipsUpdated: function (oEvent) {
      this.getView().getModel("viewModel")
        .setProperty("/membershipCount", oEvent.getParameter("total"));
    },
    onMembershipSelectionChange: function () {
      this.getView().getModel("viewModel").setProperty(
        "/membershipDeleteEnabled",
        this.byId("membershipTable").getSelectedItems().length > 0
      );
    },

    onAddMembership: function () {
      this.byId("mType").setSelectedKey("YOE");
      this.byId("mStatus").setSelectedKey("E0001");
      this.byId("mReason").setValue("");
      this.byId("mFrom").setValue("");
      this.byId("mTo").setValue("");
      this.byId("membershipDialog").open();
    },
    onMembershipPress: function (oEvent) {
      var oCtx = oEvent.getSource().getBindingContext
        ? oEvent.getSource().getBindingContext()
        : oEvent.getSource().getParent().getBindingContext();
      var d = oCtx.getObject();
      this.getOwnerComponent().getRouter().navTo("membership", {
        partnerId:    d.Partner_Id,
        membershipId: d.Membership_id,
        validTo:      d.valid_to
      });
    },
    onSaveMembership: function () {
      var sFrom = this.byId("mFrom").getValue();
      var sTo   = this.byId("mTo").getValue();
      if (!sFrom || !sTo) { MessageBox.error("Valid From and Valid To are required."); return; }

      this.byId("membershipTable").getBinding("items").create({
        Partner_Id:       this._partnerId,
        Partner_Type:     this.byId("mType").getSelectedKey(),
        PT_Status:        this.byId("mStatus").getSelectedKey(),
        PT_Status_Reason: this.byId("mReason").getValue().trim(),
        Valid_from:       sFrom,
        valid_to:         sTo
      });
      this.getView().getModel().submitBatch("membershipUpdate")
        .then(function ()  { MessageToast.show("Membership created."); this.byId("membershipDialog").close(); }.bind(this))
        .catch(function (e){ MessageBox.error("Create failed: " + e.message); });
    },
    onCancelMembership: function () { this.byId("membershipDialog").close(); },

    onDeleteMemberships: function () {
      var aItems = this.byId("membershipTable").getSelectedItems();
      if (!aItems.length) return;
      MessageBox.confirm("Delete " + aItems.length + " membership(s)?", {
        onClose: function (sAction) {
          if (sAction !== MessageBox.Action.OK) return;
          Promise.all(aItems.map(function (i) { return i.getBindingContext().delete("$auto"); }))
            .then(function () {
              MessageToast.show(aItems.length + " membership(s) deleted.");
              this.getView().getModel("viewModel").setProperty("/membershipDeleteEnabled", false);
            }.bind(this))
            .catch(function (e){ MessageBox.error("Delete failed: " + e.message); });
        }.bind(this)
      });
    },

    // ── Helper ────────────────────────────────────────────────────────────────
    _ids: function (aIds) {
      return aIds.map(function (sId) { return this.byId(sId); }.bind(this));
    }
  });
});
