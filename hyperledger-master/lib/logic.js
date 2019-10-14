/**
 * @param {org.ricex.net.CreateCompany} createCompany
 * @transaction
 */
async function createCompany(createCompany) {
    var factory = getFactory();
    var NS = "org.ricex.net";
  
    var company = factory.newResource(NS, "Company", createCompany.companyId);
    company.name = createCompany.name;
  
    var id = await identityIssue(createCompany.companyId, createCompany.name);
    return getParticipantRegistry(NS + ".Company").then(function(companyRegistry) {
      return companyRegistry.addAll([company]);
    });
  }
  
  /**
   * @param {org.ricex.net.CreateTrade} createTrade
   * @transaction
   */
  async function createTrade(createTrade) {
    var factory = getFactory();
    var NS = "org.ricex.net";
  
    var trade = factory.newResource(NS, "Trade", "Trade1000");
    trade.owner = factory.newRelationship(NS, "Company", "999");
    trade.status = 0;
    return getAssetRegistry(NS + ".Trade").then(function(tradeRegistry) {
      return tradeRegistry.addAll([trade]);
    });
  }
  
  /**
   * @param {org.ricex.net.UpdateTrade} updateTrade
   * @transaction
   */
  async function updateTrade(updateTrade) {
    var trade = updateTrade.newStatus;
  
    return getAssetRegistry(NS + ".Trade").then(function(tradeRegistry) {
      return tradeRegistry.update(trade);
    });
  }
  
