const cds = require('@sap/cds');

module.exports = cds.service.impl(async function () {

    const { partner } = this.entities;

    this.before('CREATE', partner, async (req) => {

        if (req.data.Partner_Id) return;

        const tx = cds.transaction(req);

        if (cds.db.kind === 'hana') {

            const result = await tx.run(`
                SELECT "Partner_SEQ".NEXTVAL AS ID
                FROM DUMMY
            `);

            req.data.Partner_Id =
                'P' + String(result[0].ID).padStart(9, '0');

        } else {

            const last = await tx.run(
                SELECT.one
                    .from(partner)
                    .columns('Partner_Id')
                    .orderBy({ Partner_Id: 'desc' })
            );

            let next = 1;

            if (last?.Partner_Id) {
                next = parseInt(last.Partner_Id.substring(1), 10) + 1;
            }

            req.data.Partner_Id =
                'P' + String(next).padStart(9, '0');
        }

    });

});