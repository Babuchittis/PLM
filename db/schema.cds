namespace partnermgmt;

using { cuid, managed } from '@sap/cds/common';


// ─── Core entities ────────────────────────────────────────────────────────────

entity Partner:cuid, managed {
  key Partner_Id     : String(10);
      Name_org       : String(50);
      Country        : String(3);
      Partner_status : String(5);
      Partner_level  : String(20);
      // associations
      Memberships    : Composition of many Membership on Memberships.Partner_Id = $self.Partner_Id;
      Contacts       : Composition of many Contact    on Contacts.Partner_Id    = $self.Partner_Id;
}

entity Membership {
  key Partner_Id       : String(10);
  key Membership_id    : String(10);
  key valid_to         : Date;
      Valid_from       : Date;
      Partner_Type     : String(10);
      PT_Status        : String(10);
      PT_Status_Reason : String(50);
      // associations
      Dimensions       : Composition of many Dimension    on Dimensions.Membership_id    = $self.Membership_id;
      Descriptors      : Composition of many PartDescriptor on Descriptors.Membership_id = $self.Membership_id;
      partner          : Association to Partner            on partner.Partner_Id          = $self.Partner_Id;
}

entity Contact {
  key Partner_Id  : String(10);
  key Contact_Id  : String(10);
      First_Name  : String(40);
      Last_Name   : String(40);
      Email       : String(80) @assert.unique;
      Function    : String(40);
      Department  : String(40);
      Comm_lang   : String(2);
      // Role is the combination of Partner + Contact (stored as virtual label)
      Role        : String(50);
      partner     : Association to Partner on partner.Partner_Id = $self.Partner_Id;
}

entity Dimension {
  key Membership_id    : String(10);
  key Dim_id           : String(10);
  key valid_to         : Date;
      Valid_from       : Date;
      Dim_Status       : String(30);
      PT_Status_Reason : String(50);
}

entity PartDescriptor {
  key Descriptor_ID : String(10);
  key Partner_Id    : String(10);
  key Membership_id : String(10);
  key valid_to      : Date;
      Valid_from    : Date;
      Description   : String(100);
}

// ─── Value-help / config tables ───────────────────────────────────────────────

entity PartnerStatusValues {
  key Partner_status : String(5);
      status_text    : String(30);
}

entity PartnerTypes {
  key Partner_type      : String(10);
      Partner_type_text : String(30);
}

entity PTStatusValues {
  key PT_Status   : String(5);
      status_text : String(30);
}

entity DimensionValues {
  key Dim_Id   : String(10);
      Dim_text : String(30);
}

entity DimStatusValues {
  key Dim_Status      : String(5);
      Dim_status_text : String(30);
}

entity DescriptorValues {
  key Descriptor_ID : String(10);
      Description   : String(50);
}
