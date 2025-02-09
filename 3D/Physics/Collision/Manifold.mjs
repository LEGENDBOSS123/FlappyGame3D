import Contact from "./Contact.mjs";

var Manifold = class {
    constructor(options) {
        this.body1 = options?.body1 ?? null;
        this.body2 = options?.body2 ?? null;
        this.contacts = options?.contacts ?? [];
    }

    addContact(contact) {
        this.contacts.push(contact);
    }

    clearContacts() {
        this.contacts = [];
    }

    toJSON() {
        return {
            body1: this.body1.id,
            body2: this.body2.id,
            contacts: this.contacts.map(function (contact) {
                return contact.toJSON();
            })
        };
    }

    static fromJSON(json, world) {
        var manifold = new Manifold({
            body1: world.getByID(json.body1),
            body2: world.getByID(json.body2),
            contacts: json.contacts.map(function (contact) {
                return Contact.fromJSON(contact, world);
            })
        });
        return manifold;
    }
};


export default Manifold;