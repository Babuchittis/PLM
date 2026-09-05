namespace bp;

// ─── Lookup / Text Tables ────────────────────────────────────────────────────

/** Partner status code table */
entity YBP_T_STATUS {
  key Partner_status : String(5);
      status_text    : String(30);
}

/** Partner type code table */
entity YBP_T_PT {
  key Partner_type      : String(10);
      Partner_type_text : String(30);
}

/** Partner type status code table */
entity YPT_T_STATUS {
  key PT_Status   : String(5);
      status_text : String(30);
}

/** Dimension text table */
entity YPT_T_PTD {
  key Dim_Id   : String(10);
      Dim_text : String(30);
}

/** Dimension status text table */
entity YPTD_T_STATUS {
  key Dim_Status      : String(5);
      Dim_status_text : String(30);
}

/** Descriptor text table */
entity YBP_T_DESC {
  key Descriptor_ID : String(10);
      Description   : String(50);
}

// ─── Master Data Tables ──────────────────────────────────────────────────────

/** Business Partner master data */
entity YBP_D_PARTNER {
  key Partner_Id     : Integer @Core.Computed @readonly;
      Name_org       : String(50);
      Country        : String(3);
      Partner_status : String(5);
      Partner_level  : String(20);

      // Associations
      status         : Association to YBP_T_STATUS on status.Partner_status = Partner_status;
}

/** Business Partner contacts */
entity YBP_D_CONTACTS {
  key Partner_Id  : Integer;
  key Contact_Id  : Integer @Core.Computed @readonly;
      First_Name  : String(40);
      Last_Name   : String(40);
      Email       : String(80);
      Function    : String(40);
      Department  : String(40);
      Comm_lang   : String(2);

      // Associations
      partner     : Association to YBP_D_PARTNER on partner.Partner_Id = Partner_Id;
}

/** Business Partner types / memberships */
entity YBP_D_PARTNERTYPES {
  key Partner_Id       : Integer;
  key Membership_id    : Integer @Core.Computed @readonly;
  key valid_to         : Date;
      Valid_from       : Date;
      Partner_Type     : String(10);
      PT_Status        : String(10);
      PT_Status_Reason : String(50);

      // Associations
      partner          : Association to YBP_D_PARTNER  on partner.Partner_Id   = Partner_Id;
      partnerType      : Association to YBP_T_PT       on partnerType.Partner_type = Partner_Type;
      ptStatus         : Association to YPT_T_STATUS   on ptStatus.PT_Status   = PT_Status;
}

/** Dimension assignments per membership */
entity YPT_D_DIMENSIONS {
  key Membership_id    : Integer;
  key Dim_id           : String(10);
  key valid_to         : Date;
      Valid_from       : Date;
      Dim_Status       : String(30);
      PT_Status_Reason : String(50);

      // Associations
      membership       : Association to YBP_D_PARTNERTYPES on membership.Membership_id = Membership_id;
      dimension        : Association to YPT_T_PTD          on dimension.Dim_Id         = Dim_id;
      dimStatus        : Association to YPTD_T_STATUS      on dimStatus.Dim_Status      = Dim_Status;
}

/** Partner descriptor per membership / validity period */
entity YBP_D_PART_DESC {
  key Descriptor_ID : String(10);
  key Partner_Id    : Integer;
  key Membership_id : Integer;
  key valid_to      : Date;
      Valid_from    : Date;
      Description   : String(100);

      // Associations
      partner       : Association to YBP_D_PARTNER on partner.Partner_Id = Partner_Id;
      descriptor    : Association to YBP_T_DESC    on descriptor.Descriptor_ID = Descriptor_ID;
}
