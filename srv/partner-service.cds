using bp from '../db/schema';

service PartnerService {

  entity Partner      as projection on bp.YBP_D_PARTNER;
  entity Contacts     as projection on bp.YBP_D_CONTACTS;
  entity PartnerTypes as projection on bp.YBP_D_PARTNERTYPES;
  entity Dimensions   as projection on bp.YPT_D_DIMENSIONS;
  entity PartnerDesc  as projection on bp.YBP_D_PART_DESC;

  // Lookup / text tables (read-only)
  @readonly entity StatusCodes      as projection on bp.YBP_T_STATUS;
  @readonly entity PartnerTypeCodes as projection on bp.YBP_T_PT;
  @readonly entity PTStatusCodes    as projection on bp.YPT_T_STATUS;
  @readonly entity DimCodes         as projection on bp.YPT_T_PTD;
  @readonly entity DimStatusCodes   as projection on bp.YPTD_T_STATUS;
  @readonly entity DescriptorTexts  as projection on bp.YBP_T_DESC;
}
