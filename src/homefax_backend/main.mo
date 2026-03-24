import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";

actor HomeFax {

  // ─── Types ──────────────────────────────────────────────────────────────────

  public type PropertyId = Nat;
  public type RecordId = Nat;

  public type MaintenanceCategory = {
    #Plumbing;
    #HVAC;
    #Electrical;
    #Roofing;
    #Foundation;
    #Appliances;
    #Landscaping;
    #Pest;
    #Inspection;
    #Renovation;
    #Other;
  };

  public type Property = {
    id: PropertyId;
    address: Text;
    city: Text;
    state: Text;
    zipCode: Text;
    yearBuilt: Nat;
    squareFeet: Nat;
    owner: Principal;
    createdAt: Int;
    isPublic: Bool;
  };

  public type MaintenanceRecord = {
    id: RecordId;
    propertyId: PropertyId;
    category: MaintenanceCategory;
    title: Text;
    description: Text;
    contractor: ?Text;
    cost: ?Nat;          // in cents to avoid floats
    datePerformed: Int;  // Unix timestamp ms
    addedBy: Principal;
    createdAt: Int;
    receiptHash: ?Text;  // SHA-256 hash of uploaded receipt
    verified: Bool;
  };

  public type CreatePropertyArgs = {
    address: Text;
    city: Text;
    state: Text;
    zipCode: Text;
    yearBuilt: Nat;
    squareFeet: Nat;
    isPublic: Bool;
  };

  public type CreateRecordArgs = {
    propertyId: PropertyId;
    category: MaintenanceCategory;
    title: Text;
    description: Text;
    contractor: ?Text;
    cost: ?Nat;
    datePerformed: Int;
    receiptHash: ?Text;
  };

  public type HomeFaxReport = {
    property: Property;
    records: [MaintenanceRecord];
    totalCost: Nat;
    recordCount: Nat;
  };

  public type Error = {
    #NotFound;
    #NotAuthorized;
    #InvalidInput: Text;
    #AlreadyExists;
  };

  // ─── State ───────────────────────────────────────────────────────────────────

  private stable var nextPropertyId: Nat = 1;
  private stable var nextRecordId: Nat = 1;

  private stable var propertiesEntries: [(PropertyId, Property)] = [];
  private stable var recordsEntries: [(RecordId, MaintenanceRecord)] = [];

  private var properties = HashMap.fromIter<PropertyId, Property>(
    propertiesEntries.vals(), 10, Nat.equal, Hash.hash
  );

  private var records = HashMap.fromIter<RecordId, MaintenanceRecord>(
    recordsEntries.vals(), 10, Nat.equal, Hash.hash
  );

  // ─── System hooks (stable storage) ──────────────────────────────────────────

  system func preupgrade() {
    propertiesEntries := Iter.toArray(properties.entries());
    recordsEntries := Iter.toArray(records.entries());
  };

  system func postupgrade() {
    propertiesEntries := [];
    recordsEntries := [];
  };

  // ─── Property functions ──────────────────────────────────────────────────────

  public shared(msg) func registerProperty(args: CreatePropertyArgs) : async Result.Result<Property, Error> {
    let caller = msg.caller;

    if (Text.size(args.address) == 0) {
      return #err(#InvalidInput("Address cannot be empty"));
    };

    let id = nextPropertyId;
    nextPropertyId += 1;

    let property: Property = {
      id;
      address = args.address;
      city = args.city;
      state = args.state;
      zipCode = args.zipCode;
      yearBuilt = args.yearBuilt;
      squareFeet = args.squareFeet;
      owner = caller;
      createdAt = Time.now();
      isPublic = args.isPublic;
    };

    properties.put(id, property);
    #ok(property)
  };

  public shared(msg) func updatePropertyVisibility(propertyId: PropertyId, isPublic: Bool) : async Result.Result<Property, Error> {
    switch (properties.get(propertyId)) {
      case null { #err(#NotFound) };
      case (?prop) {
        if (prop.owner != msg.caller) return #err(#NotAuthorized);
        let updated: Property = {
          id = prop.id;
          address = prop.address;
          city = prop.city;
          state = prop.state;
          zipCode = prop.zipCode;
          yearBuilt = prop.yearBuilt;
          squareFeet = prop.squareFeet;
          owner = prop.owner;
          createdAt = prop.createdAt;
          isPublic;
        };
        properties.put(propertyId, updated);
        #ok(updated)
      };
    }
  };

  public query func getProperty(propertyId: PropertyId) : async Result.Result<Property, Error> {
    switch (properties.get(propertyId)) {
      case null { #err(#NotFound) };
      case (?prop) { #ok(prop) };
    }
  };

  public query(msg) func getMyProperties() : async [Property] {
    let caller = msg.caller;
    Iter.toArray(
      Iter.filter(properties.vals(), func (p: Property) : Bool {
        p.owner == caller
      })
    )
  };

  public query func searchProperties(zipCode: Text) : async [Property] {
    Iter.toArray(
      Iter.filter(properties.vals(), func (p: Property) : Bool {
        p.isPublic and p.zipCode == zipCode
      })
    )
  };

  // ─── Maintenance record functions ────────────────────────────────────────────

  public shared(msg) func addMaintenanceRecord(args: CreateRecordArgs) : async Result.Result<MaintenanceRecord, Error> {
    let caller = msg.caller;

    // Verify property exists and caller is owner
    switch (properties.get(args.propertyId)) {
      case null { return #err(#NotFound) };
      case (?prop) {
        if (prop.owner != caller) return #err(#NotAuthorized);
      };
    };

    if (Text.size(args.title) == 0) {
      return #err(#InvalidInput("Title cannot be empty"));
    };

    let id = nextRecordId;
    nextRecordId += 1;

    let record: MaintenanceRecord = {
      id;
      propertyId = args.propertyId;
      category = args.category;
      title = args.title;
      description = args.description;
      contractor = args.contractor;
      cost = args.cost;
      datePerformed = args.datePerformed;
      addedBy = caller;
      createdAt = Time.now();
      receiptHash = args.receiptHash;
      verified = false;
    };

    records.put(id, record);
    #ok(record)
  };

  public shared(msg) func deleteMaintenanceRecord(recordId: RecordId) : async Result.Result<(), Error> {
    switch (records.get(recordId)) {
      case null { #err(#NotFound) };
      case (?record) {
        switch (properties.get(record.propertyId)) {
          case null { #err(#NotFound) };
          case (?prop) {
            if (prop.owner != msg.caller) return #err(#NotAuthorized);
            records.delete(recordId);
            #ok(())
          };
        }
      };
    }
  };

  public query func getPropertyRecords(propertyId: PropertyId) : async [MaintenanceRecord] {
    Iter.toArray(
      Iter.filter(records.vals(), func (r: MaintenanceRecord) : Bool {
        r.propertyId == propertyId
      })
    )
  };

  // ─── HomeFax Report ──────────────────────────────────────────────────────────

  public query func getHomeFaxReport(propertyId: PropertyId) : async Result.Result<HomeFaxReport, Error> {
    switch (properties.get(propertyId)) {
      case null { #err(#NotFound) };
      case (?prop) {
        let propRecords = Iter.toArray(
          Iter.filter(records.vals(), func (r: MaintenanceRecord) : Bool {
            r.propertyId == propertyId
          })
        );

        let totalCost = Array.foldLeft<MaintenanceRecord, Nat>(
          propRecords, 0,
          func (acc, r) {
            switch (r.cost) {
              case null { acc };
              case (?c) { acc + c };
            }
          }
        );

        #ok({
          property = prop;
          records = propRecords;
          totalCost;
          recordCount = propRecords.size();
        })
      };
    }
  };

  // ─── Stats ───────────────────────────────────────────────────────────────────

  public query func getStats() : async { totalProperties: Nat; totalRecords: Nat } {
    {
      totalProperties = properties.size();
      totalRecords = records.size();
    }
  };
}
