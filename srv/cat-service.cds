using partnermgmt from '../db/schema';

service partnerServices {

  entity partner as projection on partnermgmt.Partner;
  entity membership as projection on partnermgmt.Membership;
  entity contact as projection on partnermgmt.Contact;
  entity dimension as projection on partnermgmt.Dimension
}