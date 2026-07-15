using partnermgmt from '../db/schema';

service partnerServices {

  entity partner as projection on partnermgmt.Partner;
  entity membership as projection on partnermgmt.Membership;
  entity contact as projection on partnermgmt.Contact;
  entity dimension as projection on partnermgmt.Dimension
}



  // ── Value-help entities (read-only) ───────────────────────────────────────
  @readonly entity PartnerStatusVH  as projection on partnermgmt.PartnerStatusValues;
  @readonly entity PartnerTypesVH   as projection on partnermgmt.PartnerTypes;
  @readonly entity PTStatusVH       as projection on partnermgmt.PTStatusValues;
  @readonly entity DimensionVH      as projection on partnermgmt.DimensionValues;
  @readonly entity DimStatusVH      as projection on partnermgmt.DimStatusValues;
  @readonly entity DescriptorVH     as projection on partnermgmt.DescriptorValues;
