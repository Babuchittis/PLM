import cds from '@sap/cds';

export default class PartnerService extends cds.ApplicationService {

  async init() {
    this.before('CREATE', 'Partner',      async req => {
      req.data.Partner_Id    = await this._nextId('Partner',      'Partner_Id');
    });
    this.before('CREATE', 'Contacts',     async req => {
      req.data.Contact_Id    = await this._nextId('Contacts',     'Contact_Id');
    });
    this.before('CREATE', 'PartnerTypes', async req => {
      req.data.Membership_id = await this._nextId('PartnerTypes', 'Membership_id');
    });
    return super.init();
  }

  async _nextId(entityName, field) {
    const rows = await this.run(SELECT.from(this.entities[entityName]).columns(field));
    return rows.reduce((max, r) => Math.max(max, r[field] || 0), 0) + 1;
  }
}
