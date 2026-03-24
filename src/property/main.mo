/**
 * HomeFax Property Canister
 * Handles property registration, verification, and tier-based limits.
 * Supports Free, Pro, Premium, and ContractorPro subscription tiers.
 */

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";

actor Property {

  // ─── Types ──────────────────────────────────────────────────────────────────

  /// Type of residential property
  public type PropertyType = {
    #SingleFamily;
    #Condo;
    #Townhouse;
    #MultiFamily;
  };

  /// Verification level assigned by admins or future oracle
  public type VerificationLevel = {
    #Unverified;
    #Basic;
    #Premium;
  };

  /// User subscription tier — determines property limit
  public type SubscriptionTier = {
    #Free;          // 1 property
    #Pro;           // 5 properties
    #Premium;       // 25 properties
    #ContractorPro; // unlimited
  };

  /// Full on-chain property record
  public type Property = {
    id: Nat;
    owner: Principal;
    address: Text;
    city: Text;
    state: Text;
    zipCode: Text;
    propertyType: PropertyType;
    yearBuilt: Nat;
    squareFeet: Nat;
    verificationLevel: VerificationLevel;
    tier: SubscriptionTier;
    createdAt: Int;
    updatedAt: Int;
    isActive: Bool;
  };

  public type RegisterPropertyArgs = {
    address: Text;
    city: Text;
    state: Text;
    zipCode: Text;
    propertyType: PropertyType;
    yearBuilt: Nat;
    squareFeet: Nat;
    tier: SubscriptionTier;
  };

  public type Metrics = {
    totalProperties: Nat;
    verifiedProperties: Nat;
    unverifiedProperties: Nat;
    isPaused: Bool;
  };

  public type Error = {
    #NotFound;
    #NotAuthorized;
    #Paused;
    #LimitReached;
    #InvalidInput: Text;
  };

  // ─── Stable State (persists across upgrades) ─────────────────────────────────

  private stable var nextId: Nat = 1;
  private stable var isPaused: Bool = false;
  private stable var admins: [Principal] = [];

  /// Stable entries for HashMap persistence across upgrades
  private stable var propertyEntries: [(Nat, Property)] = [];

  // ─── Mutable State ───────────────────────────────────────────────────────────

  /// In-memory HashMap rebuilt from stable entries after each upgrade
  private var properties = HashMap.fromIter<Nat, Property>(
    propertyEntries.vals(),
    16,
    Nat.equal,
    Hash.hash
  );

  // ─── Upgrade Hooks ───────────────────────────────────────────────────────────

  /// Save HashMap contents to stable variables before canister upgrade
  system func preupgrade() {
    propertyEntries := Iter.toArray(properties.entries());
  };

  /// Clear stable entries after upgrade (data is back in HashMap)
  system func postupgrade() {
    propertyEntries := [];
  };

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private func isAdmin(caller: Principal) : Bool {
    Array.find<Principal>(admins, func (a) { a == caller }) != null
  };

  private func requireActive() : Result.Result<(), Error> {
    if (isPaused) #err(#Paused) else #ok(())
  };

  /// Count how many active properties a principal owns
  private func countOwnerProperties(owner: Principal) : Nat {
    var count = 0;
    for (prop in properties.vals()) {
      if (prop.owner == owner and prop.isActive) { count += 1 };
    };
    count
  };

  // ─── Tier Limits ─────────────────────────────────────────────────────────────

  /// Maximum number of properties allowed per subscription tier.
  /// Returns 0 for ContractorPro to indicate unlimited.
  public query func getPropertyLimitForTier(tier: SubscriptionTier) : async Nat {
    switch (tier) {
      case (#Free)          { 1 };
      case (#Pro)           { 5 };
      case (#Premium)       { 25 };
      case (#ContractorPro) { 0 }; // 0 = unlimited
    }
  };

  // ─── Admin Controls ───────────────────────────────────────────────────────────

  /// Add a new admin principal
  public shared(msg) func addAdmin(newAdmin: Principal) : async Result.Result<(), Error> {
    if (admins.size() > 0 and not isAdmin(msg.caller)) return #err(#NotAuthorized);
    admins := Array.append(admins, [newAdmin]);
    #ok(())
  };

  /// Pause the canister (admin only) — prevents all write operations
  public shared(msg) func pause() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := true;
    #ok(())
  };

  /// Unpause the canister (admin only)
  public shared(msg) func unpause() : async Result.Result<(), Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);
    isPaused := false;
    #ok(())
  };

  // ─── Property Functions ───────────────────────────────────────────────────────

  /// Register a new property for the calling principal
  public shared(msg) func registerProperty(args: RegisterPropertyArgs) : async Result.Result<Property, Error> {
    switch (requireActive()) { case (#err(e)) return #err(e); case _ {} };

    let caller = msg.caller;

    if (Text.size(args.address) == 0) return #err(#InvalidInput("Address cannot be empty"));

    // Enforce tier limit (0 = unlimited for ContractorPro)
    let limit = switch (args.tier) {
      case (#Free) { 1 };
      case (#Pro) { 5 };
      case (#Premium) { 25 };
      case (#ContractorPro) { 0 };
    };

    if (limit > 0 and countOwnerProperties(caller) >= limit) {
      return #err(#LimitReached);
    };

    let id = nextId;
    nextId += 1;
    let now = Time.now();

    let prop: Property = {
      id;
      owner = caller;
      address = args.address;
      city = args.city;
      state = args.state;
      zipCode = args.zipCode;
      propertyType = args.propertyType;
      yearBuilt = args.yearBuilt;
      squareFeet = args.squareFeet;
      verificationLevel = #Unverified;
      tier = args.tier;
      createdAt = now;
      updatedAt = now;
      isActive = true;
    };

    properties.put(id, prop);
    #ok(prop)
  };

  /// Get all active properties owned by the caller
  public query(msg) func getMyProperties() : async [Property] {
    let caller = msg.caller;
    Iter.toArray(
      Iter.filter(properties.vals(), func (p: Property) : Bool {
        p.owner == caller and p.isActive
      })
    )
  };

  /// Get a single property by ID (public read)
  public query func getProperty(id: Nat) : async Result.Result<Property, Error> {
    switch (properties.get(id)) {
      case null { #err(#NotFound) };
      case (?p) { #ok(p) };
    }
  };

  /// Set the verification level for a property (admin only)
  public shared(msg) func verifyProperty(id: Nat, level: VerificationLevel) : async Result.Result<Property, Error> {
    if (not isAdmin(msg.caller)) return #err(#NotAuthorized);

    switch (properties.get(id)) {
      case null { #err(#NotFound) };
      case (?existing) {
        let updated: Property = {
          id = existing.id;
          owner = existing.owner;
          address = existing.address;
          city = existing.city;
          state = existing.state;
          zipCode = existing.zipCode;
          propertyType = existing.propertyType;
          yearBuilt = existing.yearBuilt;
          squareFeet = existing.squareFeet;
          verificationLevel = level;
          tier = existing.tier;
          createdAt = existing.createdAt;
          updatedAt = Time.now();
          isActive = existing.isActive;
        };
        properties.put(id, updated);
        #ok(updated)
      };
    }
  };

  // ─── Metrics ─────────────────────────────────────────────────────────────────

  /// Return platform-level property metrics (public read)
  public query func getMetrics() : async Metrics {
    var verified = 0;
    var unverified = 0;

    for (prop in properties.vals()) {
      if (prop.isActive) {
        switch (prop.verificationLevel) {
          case (#Unverified) { unverified += 1 };
          case (#Basic or #Premium) { verified += 1 };
        };
      };
    };

    {
      totalProperties = properties.size();
      verifiedProperties = verified;
      unverifiedProperties = unverified;
      isPaused;
    }
  };
}
